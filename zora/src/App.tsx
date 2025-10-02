import { Fragment, useEffect, useMemo, useState, type FormEvent, type SyntheticEvent } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LoopIcon from '@mui/icons-material/Loop';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import logoUrl from '../../designs/logos/logo.png';
import { LOGO_COLOR, PRODUCT_NAME_COLOR, designTokens } from './designSystem';
import { siteCopy, notifications } from './siteCopy';

type Product = {
  id: number;
  name: string;
  price: number;
  vatRate: number;
  category: string;
  description: string;
  image: string;
  inventoryStatus: string;
};

type User = {
  id: number;
  email: string;
  createdAt?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProductArray(value: unknown): value is Product[] {
  return (
    Array.isArray(value) &&
    value.every(item =>
      isRecord(item) &&
      typeof item.id === 'number' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      typeof item.vatRate === 'number' &&
      typeof item.category === 'string' &&
      typeof item.description === 'string' &&
      typeof item.image === 'string' &&
      typeof item.inventoryStatus === 'string',
    )
  );
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const ALL_CATEGORY = siteCopy.products.filters.all;
const MAIN_SECTIONS = {
  products: 'products',
  forums: 'forums',
  account: 'account',
} as const;
type MainSection = (typeof MAIN_SECTIONS)[keyof typeof MAIN_SECTIONS];

const AUTH_MODES = {
  login: 'login',
  register: 'register',
} as const;
type AuthMode = (typeof AUTH_MODES)[keyof typeof AUTH_MODES];

const EMAIL_REGEX = new RegExp('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');

const forumFolders = [
  {
    id: 'global-chat',
    name: siteCopy.forums.folders.globalChat.name,
    icon: <ChatBubbleOutlineIcon fontSize="small" />,
    badge: {
      label: siteCopy.forums.folders.globalChat.badgeLabel,
      icon: <PersonOutlineIcon fontSize="small" />,
    },
    description: siteCopy.forums.folders.globalChat.description,
  },
  {
    id: 'explain-like-im-five',
    name: siteCopy.forums.folders.explainLikeImFive.name,
    icon: <FolderOutlinedIcon fontSize="small" />,
    badge: {
      label: siteCopy.forums.folders.explainLikeImFive.badgeLabel,
      icon: <AutoAwesomeIcon fontSize="small" />,
    },
    description: siteCopy.forums.folders.explainLikeImFive.description,
  },
];

function getInventoryChipProps(status: string) {
  const normalized = status.trim().toLowerCase();
  const normalizedWords = normalized.replace(/[_-]+/g, ' ');

  if (normalizedWords.includes('in stock')) {
    return {
      color: 'success' as const,
      icon: <CheckCircleOutlineIcon fontSize="small" />,
    };
  }

  if (normalizedWords.includes('low')) {
    return {
      color: 'warning' as const,
      icon: <ErrorOutlineIcon fontSize="small" />,
    };
  }

  if (normalizedWords.includes('backorder') || normalizedWords.includes('back order')) {
    return {
      color: 'info' as const,
      icon: <LoopIcon fontSize="small" />,
    };
  }

  if (normalizedWords.includes('preorder') || normalizedWords.includes('pre order')) {
    return {
      color: 'info' as const,
      icon: <ScheduleIcon fontSize="small" />,
    };
  }

  if (normalizedWords.includes('made to order')) {
    return {
      color: 'info' as const,
      icon: <BuildCircleIcon fontSize="small" />,
    };
  }

  return {
    color: 'default' as const,
    icon: <Inventory2OutlinedIcon fontSize="small" />,
  };
}
export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [authMode, setAuthMode] = useState<AuthMode>(AUTH_MODES.login);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/data`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const payload: unknown = await response.json();
        let nextProducts: Product[] | null = null;

        if (isProductArray(payload)) {
          nextProducts = payload;
        } else if (
          isRecord(payload) &&
          'products' in payload &&
          isProductArray((payload as { products: unknown }).products)
        ) {
          nextProducts = (payload as { products: Product[] }).products;
        }

        if (!nextProducts) {
          throw new Error(siteCopy.products.errors.missingCollection);
        }

        setProducts(nextProducts);
        setError(null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        setError((err as Error).message ?? 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach(product => unique.add(product.category));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) {
      return products;
    }
    return products.filter(product => product.category === activeCategory);
  }, [activeCategory, products]);

  const currentSection: MainSection = useMemo(() => {
    const [, section] = location.pathname.split('/');
    if (
      section === MAIN_SECTIONS.products ||
      section === MAIN_SECTIONS.forums ||
      section === MAIN_SECTIONS.account
    ) {
      return section;
    }
    return MAIN_SECTIONS.products;
  }, [location.pathname]);

  const isProductsRoute = currentSection === MAIN_SECTIONS.products;

  const handleCategoryChange = (_event: SyntheticEvent, value: string) => {
    setActiveCategory(value);
  };

  const handleSectionChange = (_event: SyntheticEvent, value: MainSection) => {
    navigate(`/${value}`);
  };

  const handleAuthModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthSuccess(null);
    setAuthPassword('');
    if (mode === AUTH_MODES.login) {
      setAuthEmail(prev => prev || (currentUser?.email ?? ''));
    } else {
      setAuthEmail('');
    }
  };

  const openAuthSection = (mode: AuthMode) => {
    handleAuthModeChange(mode);
    navigate(`/${MAIN_SECTIONS.account}`);
  };
  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = authEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setAuthError(notifications.auth.invalidEmail);
      return;
    }

    if (authPassword.length < 8) {
      setAuthError(notifications.auth.passwordTooShort);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const endpoint = authMode === AUTH_MODES.login ? `${API_BASE_URL}/api/login` : `${API_BASE_URL}/api/users`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: authPassword }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch (jsonError) {
        payload = null;
      }

      if (!response.ok) {
        const message =
          isRecord(payload) && typeof payload.message === 'string'
            ? payload.message
            : authMode === AUTH_MODES.login
              ? notifications.auth.loginFailure
               : notifications.auth.registerFailure;
        throw new Error(message);
      }

      if (!isRecord(payload) || !('user' in payload) || !isRecord((payload as { user: unknown }).user)) {
        throw new Error(notifications.auth.unexpectedResponse);
      }

      const userRecord = (payload as { user: Record<string, unknown> }).user;

      if (typeof userRecord.email !== 'string') {
        throw new Error(notifications.auth.unexpectedResponse);
      }

      let userId: number | null = null;

      if (typeof userRecord.id === 'number') {
        userId = userRecord.id;
      } else if (typeof userRecord.id === 'string') {
        const parsed = Number(userRecord.id);
        if (Number.isFinite(parsed)) {
          userId = parsed;
        }
      }

      if (userId === null) {
        throw new Error(notifications.auth.unexpectedResponse);
      }

      const user: User = {
        id: userId,
        email: userRecord.email,
        createdAt: typeof userRecord.createdAt === 'string' ? userRecord.createdAt : undefined,
      };

      setCurrentUser(user);
      setAuthSuccess(authMode === AUTH_MODES.login ? notifications.auth.loginSuccess : notifications.auth.registerSuccess);
      setAuthEmail(user.email);
      setAuthPassword('');
    } catch (error) {
      setAuthError((error as Error).message || notifications.auth.genericError);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    const lastEmail = currentUser?.email ?? '';
    setCurrentUser(null);
    setAuthSuccess(notifications.auth.logoutSuccess);
    setAuthPassword('');
    setAuthEmail(lastEmail);
  };

  const handleSwitchAccount = () => {
    setCurrentUser(null);
    handleAuthModeChange(AUTH_MODES.login);
  };

  const accountHeading = currentUser
    ? siteCopy.account.headings.loggedIn
    : authMode === AUTH_MODES.login
      ? siteCopy.account.headings.login
      : siteCopy.account.headings.register;
  const accountDescription = currentUser
    ? siteCopy.account.descriptions.loggedIn(currentUser.email)
    : authMode === AUTH_MODES.login
      ? siteCopy.account.descriptions.login
      : siteCopy.account.descriptions.register;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK',
        minimumFractionDigits: 2,
      }),
    [],
  );
  const formatCurrency = (value: number) => currencyFormatter.format(value);
  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: 'blur(12px)',
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 2, sm: 4 },
            minHeight: 72,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 2, sm: 3 },
          }}
        >
          <Box
            component="img"
            src={logoUrl}
            alt="Zora logo"
            sx={{ height: 15 }}
          />
          <Typography  sx={{ 
              fontSize: { xs: '1.9rem', sm: '1.9rem' },
              color: designTokens.colors.zoratitle 
            }}>
          {'ZORA CORE'}
        </Typography>
          <Tabs
            value={currentSection}
            onChange={handleSectionChange}
            textColor="inherit"
            TabIndicatorProps={{ sx: { backgroundColor: LOGO_COLOR } }}
            sx={{
              flexGrow: 1,
              minHeight: 72,
              '& .MuiTab-root': {
                minHeight: 72,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                color: '#ffffff',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.8)',
                },
                '&.Mui-selected': {
                  color: '#ffffff',
                },
              },
            }}
          >
            <Tab label={siteCopy.navigation.tabs.products} value={MAIN_SECTIONS.products} />
            <Tab label={siteCopy.navigation.tabs.forums} value={MAIN_SECTIONS.forums} />
            <Tab label={siteCopy.navigation.tabs.account} value={MAIN_SECTIONS.account} />
          </Tabs>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="inherit"
              size="medium"
              sx={{ px: 2.5, py: 1, fontWeight: 500, borderColor: theme => theme.palette.grey[300], color: 'inherit' }}
              disabled={authLoading}
              onClick={() => openAuthSection(AUTH_MODES.login)}
            >
              {siteCopy.navigation.authButtons.login}
            </Button>
            <Button
              variant="contained"
              size="medium"
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                backgroundColor: designTokens.colors.createUserButton,
                color: designTokens.colors.surface,
                '&:hover': {
                  backgroundColor: designTokens.colors.createUserButtonHover,
                },
              }}
              disabled={authLoading}
              onClick={() => openAuthSection(AUTH_MODES.register)}
            >
              {siteCopy.navigation.authButtons.register}
            </Button>
          </Box>
        </Toolbar>

        {isProductsRoute && (
          <Box
            sx={{
              pt: 1,
              px: { xs: 2, sm: 4 },
              borderTop: theme => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Tabs
              value={activeCategory}
              onChange={handleCategoryChange}
              textColor="inherit"
              indicatorColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              TabIndicatorProps={{
                sx: {
                  height: 3,
                  borderRadius: '999px 999px 0 0',
                  backgroundColor: designTokens.colors.highlight,
                },
              }}
              sx={{
                minHeight: 56,
                '& .MuiTabs-flexContainer': {
                  gap: 0.5,
                },
                '& .MuiTab-root': {
                  minHeight: 48,
                  px: { xs: 1.25, sm: 2 },
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 500,
                  color: designTokens.colors.subTabTextUnselected,
                  transition: theme =>
                    theme.transitions.create(['color', 'background-color'], {
                      duration: theme.transitions.duration.short,
                    }),
                  '&:hover': {
                    backgroundColor: designTokens.colors.subTabTextHover,
                  },
                  '&.Mui-selected': {
                    backgroundColor: designTokens.colors.subTabSelectedFill,
                    color: designTokens.colors.subTabTextSelected,
                  },
                },
              }}
            >
              <Tab label={siteCopy.products.filters.all} value={ALL_CATEGORY} />
              {categories.map(category => (
                <Tab key={category} label={category} value={category} />
              ))}
            </Tabs>
          </Box>
        )}
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route
            path="/products/*"
            element={
              <ProductsRoutes
                loading={loading}
                error={error}
                filteredProducts={filteredProducts}
                formatCurrency={formatCurrency}
              />
            }
          />
          <Route path="/forums/*" element={<ForumsRoutes folders={forumFolders} />} />
          <Route
            path="/account/*"
            element={
              <AccountRoute
                authMode={authMode}
                authEmail={authEmail}
                authPassword={authPassword}
                authError={authError}
                authSuccess={authSuccess}
                authLoading={authLoading}
                currentUser={currentUser}
                accountHeading={accountHeading}
                accountDescription={accountDescription}
                onAuthModeChange={handleAuthModeChange}
                onAuthSubmit={handleAuthSubmit}
                onLogout={handleLogout}
                onSwitchAccount={handleSwitchAccount}
                setAuthEmail={setAuthEmail}
                setAuthPassword={setAuthPassword}
              />
            }
          />
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </Container>

      <Footer />
    </>
  );
}
type ProductsRoutesProps = {
  loading: boolean;
  error: string | null;
  filteredProducts: Product[];
  formatCurrency: (value: number) => string;
};

function ProductsRoutes({ loading, error, filteredProducts, formatCurrency }: ProductsRoutesProps) {
  return (
    <Routes>
      <Route
        index
        element={
          <ProductsIndex
            loading={loading}
            error={error}
            filteredProducts={filteredProducts}
            formatCurrency={formatCurrency}
          />
        }
      />
      <Route path=":productId" element={<ProductsPlaceholder />} />
      <Route path="*" element={<ProductsPlaceholder />} />
    </Routes>
  );
}

type ProductsIndexProps = {
  loading: boolean;
  error: string | null;
  filteredProducts: Product[];
  formatCurrency: (value: number) => string;
};

function ProductsIndex({ loading, error, filteredProducts, formatCurrency }: ProductsIndexProps) {
  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          {siteCopy.products.heading}
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4, color: 'common.black' }}>
          {siteCopy.products.subheading}
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <Alert severity="info">{siteCopy.products.emptyState}</Alert>
      )}

      {!loading && !error &&
        filteredProducts.map(product => {
          const priceExVat = product.price;
          const priceIncVat = Number((priceExVat * (1 + product.vatRate)).toFixed(2));
          const vatPercentRaw = product.vatRate * 100;
          const vatPercentLabel = Number.isInteger(vatPercentRaw)
            ? vatPercentRaw.toFixed(0)
            : vatPercentRaw.toFixed(1);
          const { color, icon } = getInventoryChipProps(product.inventoryStatus);

          return (
            <Paper
              key={product.id}
              variant="outlined"
              sx={{
                borderRadius: 4,
                p: { xs: 3, md: 4 },
                borderColor: 'rgba(15, 23, 42, 0.08)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.06) 110%)',
                transition: theme =>
                  theme.transitions.create(['transform', 'box-shadow'], {
                    duration: theme.transitions.duration.short,
                  }),
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 24px 55px rgba(15, 23, 42, 0.16)',
                },
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 4 }} alignItems="stretch">
                <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 240 } }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      pt: { xs: '55%', md: '45%' },
                      borderRadius: 3,
                      overflow: 'hidden',
                      backgroundImage: `linear-gradient(145deg, rgba(37, 99, 235, 0.45), rgba(29, 78, 216, 0.1)), url(${product.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                </Box>
                <Stack spacing={2} flexGrow={1} justifyContent="space-between">
                  <Stack spacing={1}>
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{ fontSize: { xs: '1.75rem', md: '1.9rem' }, color: PRODUCT_NAME_COLOR }}
                    >
                      {product.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {product.description}
                    </Typography>
                  </Stack>
                  <Chip
                    label={product.category}
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 600,
                      px: 1.5,
                      borderRadius: '999px',
                      backgroundColor: designTokens.colors.categoryChipBackground,
                      color: designTokens.colors.categoryChipText,
                    }}
                  />
                </Stack>
                <Stack
                  spacing={1.5}
                  alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                  justifyContent="space-between"
                  minWidth={{ md: 220 }}
                >
                  <Stack spacing={0.75} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatCurrency(priceIncVat)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {siteCopy.products.priceLabels.exVat}: {formatCurrency(priceExVat)} ({siteCopy.products.priceLabels.vat} {vatPercentLabel}%)
                    </Typography>
                  </Stack>
                  <Chip
                    icon={icon}
                    color={color}
                    variant="outlined"
                    label={product.inventoryStatus}
                    sx={{ fontWeight: 600, px: 1.5, borderRadius: '999px' }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    sx={{ fontWeight: 600, textTransform: 'none', minWidth: { md: 200 } }}
                  >
                    {siteCopy.products.actionLabel}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
    </Stack>
  );
}
function ProductsPlaceholder() {
  const { productId } = useParams<{ productId?: string }>();
  const title = siteCopy.products.placeholders.title;
  const description = productId
    ? siteCopy.products.placeholders.description(productId)
    : siteCopy.products.placeholders.indexDescription;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={1.5}>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}


type ForumsRoutesProps = {
  folders: typeof forumFolders;
};

function ForumsRoutes({ folders }: ForumsRoutesProps) {
  return (
    <Routes>
      <Route index element={<ForumsIndex folders={folders} />} />
      <Route path=":forumId" element={<ForumsPlaceholder />} />
      <Route path="*" element={<ForumsPlaceholder />} />
    </Routes>
  );
}

type ForumsIndexProps = {
  folders: typeof forumFolders;
};

function ForumsIndex({ folders }: ForumsIndexProps) {
  return (
    <Stack spacing={3} alignItems="stretch">
      <Typography variant="h3" component="h1">
        {siteCopy.forums.heading}
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'common.black', maxWidth: 520 }}>
        {siteCopy.forums.subheading}
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <List
          component="nav"
          disablePadding
          subheader={
            <ListSubheader component="div" sx={{ fontWeight: 600 }}>
              {siteCopy.forums.directoryLabel}
            </ListSubheader>
          }
        >
          {folders.map((folder, index) => (
            <Fragment key={folder.id}>
              <ListItem disablePadding>
                <ListItemButton sx={{ alignItems: 'flex-start' }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{folder.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {folder.name}
                        </Typography>
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={folder.badge.icon}
                          label={folder.badge.label}
                        />
                      </Stack>
                    }
                    secondary={folder.description}
                    secondaryTypographyProps={{ color: 'common.black' }}
                  />
                </ListItemButton>
              </ListItem>
              {index < folders.length - 1 && <Divider component="li" />}
            </Fragment>
          ))}
        </List>
      </Paper>
      <Button variant="contained" size="large" sx={{ alignSelf: 'flex-start' }}>
        {siteCopy.forums.cta}
      </Button>
    </Stack>
  );
}

function ForumsPlaceholder() {
  const { forumId } = useParams<{ forumId?: string }>();
  const title = siteCopy.forums.placeholders.title;
  const description = forumId
    ? siteCopy.forums.placeholders.description(forumId)
    : siteCopy.forums.placeholders.indexDescription;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={1.5}>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}


type AccountRouteProps = {
  authMode: AuthMode;
  authEmail: string;
  authPassword: string;
  authError: string | null;
  authSuccess: string | null;
  authLoading: boolean;
  currentUser: User | null;
  accountHeading: string;
  accountDescription: string;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogout: () => void;
  onSwitchAccount: () => void;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
};
function AccountRoute({
  authMode,
  authEmail,
  authPassword,
  authError,
  authSuccess,
  authLoading,
  currentUser,
  accountHeading,
  accountDescription,
  onAuthModeChange,
  onAuthSubmit,
  onLogout,
  onSwitchAccount,
  setAuthEmail,
  setAuthPassword,
}: AccountRouteProps) {
  return (
    <Stack spacing={4} alignItems="stretch" maxWidth={480} mx="auto">
      <Stack spacing={1.5} alignItems="center">
        <Typography variant="h3" component="h1">
          {accountHeading}
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {accountDescription}
        </Typography>
      </Stack>

      {!currentUser && (
        <>
          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Button
              variant={authMode === AUTH_MODES.login ? 'contained' : 'text'}
              onClick={() => onAuthModeChange(AUTH_MODES.login)}
              disabled={authLoading}
            >
              {siteCopy.account.buttons.login}
            </Button>
            <Button
              variant={authMode === AUTH_MODES.register ? 'contained' : 'text'}
              onClick={() => onAuthModeChange(AUTH_MODES.register)}
              disabled={authLoading}
            >
              {siteCopy.account.buttons.register}
            </Button>
          </Stack>

          {authError && <Alert severity="error">{authError}</Alert>}
          {authSuccess && <Alert severity="success">{authSuccess}</Alert>}
        </>
      )}

      {currentUser ? (
        <Stack spacing={2.5}>
          {authSuccess && <Alert severity="success">{authSuccess}</Alert>}
          <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={2}>
              <Typography variant="h6">{siteCopy.account.status.signedInTitle}</Typography>
              <Typography color="text.secondary">{currentUser.email}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button variant="contained" onClick={onLogout}>
                  {siteCopy.account.buttons.logout}
                </Button>
                <Button variant="outlined" onClick={onSwitchAccount}>
                  {siteCopy.account.buttons.switchAccount}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }} component="form" onSubmit={onAuthSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label={siteCopy.account.form.emailLabel}
              type="email"
              autoComplete="email"
              required
              value={authEmail}
              onChange={event => setAuthEmail(event.target.value)}
              disabled={authLoading}
            />
            <TextField
              label={siteCopy.account.form.passwordLabel}
              type="password"
              autoComplete={authMode === AUTH_MODES.login ? 'current-password' : 'new-password'}
              helperText={siteCopy.account.form.passwordHelper}
              required
              value={authPassword}
              onChange={event => setAuthPassword(event.target.value)}
              disabled={authLoading}
            />
            <Button type="submit" variant="contained" size="large" disabled={authLoading}>
              {authLoading
                ? siteCopy.account.buttons.submit.waiting
                : authMode === AUTH_MODES.login
                  ? siteCopy.account.buttons.login
                  : siteCopy.account.buttons.register}
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function NotFoundRoute() {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={1.5}>
        <Typography variant="h4">{siteCopy.notFound.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {siteCopy.notFound.description}
        </Typography>
      </Stack>
    </Paper>
  );
}

function Footer() {
  const year = new Date().getFullYear();

  return (
    <Container
      component="footer"
      maxWidth="lg"
      sx={{
        py: { xs: 6, md: 8 },
        mt: { xs: 6, md: 10 },
        borderTop: theme => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 3, md: 6 }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
      >
        <Stack spacing={1}>
          <Typography variant="h6">{siteCopy.footer.heading}</Typography>
          <Typography variant="body2" color="text.secondary">
            {siteCopy.footer.tagline}
          </Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2">
            {siteCopy.footer.contactLabel} <Box component="span" sx={{ fontWeight: 600 }}>{siteCopy.footer.supportEmail}</Box>
          </Typography>
          <Typography variant="body2">{siteCopy.footer.phone}</Typography>
          <Typography variant="body2">{siteCopy.footer.address}</Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2">{siteCopy.footer.businessHours}</Typography>
          <Typography variant="body2">{siteCopy.footer.cvr}</Typography>
          <Typography variant="body2" color="text.secondary">
            {siteCopy.footer.copyright(year)}
          </Typography>
        </Stack>
      </Stack>
    </Container>
  );
}
