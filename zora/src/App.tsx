import { Fragment, useEffect, useMemo, useState, type FormEvent, type SyntheticEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
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
import logoUrl from '../../designs/logos/logo.png';
import { LOGO_COLOR, PRODUCT_NAME_COLOR, designTokens } from './designSystem';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
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
      typeof item.category === 'string' &&
      typeof item.description === 'string' &&
      typeof item.image === 'string'
    )
  );
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const ALL_CATEGORY = 'All';
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
    name: 'Global Chat Forum',
    icon: <ChatBubbleOutlineIcon fontSize="small" />,
    badge: {
      label: 'Human',
      icon: <PersonOutlineIcon fontSize="small" />,
    },
    description: 'Open dialogues with shoppers, makers, and curators across the Zora community.',
  },
  {
    id: 'explain-like-im-five',
    name: "Explain Like I'm Five",
    icon: <FolderOutlinedIcon fontSize="small" />,
    badge: {
      label: 'AI',
      icon: <AutoAwesomeIcon fontSize="small" />,
    },
    description: 'Ask the assistant anything about materials, care, or styling and get plain-language answers.',
  },
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [activeSection, setActiveSection] = useState<MainSection>(MAIN_SECTIONS.products);
  const [authMode, setAuthMode] = useState<AuthMode>(AUTH_MODES.login);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
          throw new Error('API response missing products collection');
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

  const handleCategoryChange = (_event: SyntheticEvent, value: string) => {
    setActiveCategory(value);
  };

  const handleSectionChange = (_event: SyntheticEvent, value: MainSection) => {
    setActiveSection(value);
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
    setActiveSection(MAIN_SECTIONS.account);
    handleAuthModeChange(mode);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = authEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (authPassword.length < 8) {
      setAuthError('Password must be at least 8 characters.');
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
              ? 'Unable to log in. Please try again.'
              : 'Unable to create account. Please try again.';
        throw new Error(message);
      }

      if (!isRecord(payload) || !('user' in payload) || !isRecord((payload as { user: unknown }).user)) {
        throw new Error('Unexpected response from server.');
      }

      const userRecord = (payload as { user: Record<string, unknown> }).user;

      if (typeof userRecord.email !== 'string') {
        throw new Error('Unexpected response from server.');
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
        throw new Error('Unexpected response from server.');
      }

      const user: User = {
        id: userId,
        email: userRecord.email,
        createdAt: typeof userRecord.createdAt === 'string' ? userRecord.createdAt : undefined,
      };

      setCurrentUser(user);
      setAuthSuccess(authMode === AUTH_MODES.login ? 'Logged in successfully.' : 'Account created successfully.');
      setAuthEmail(user.email);
      setAuthPassword('');
    } catch (error) {
      setAuthError((error as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    const lastEmail = currentUser?.email ?? '';
    setCurrentUser(null);
    setAuthSuccess('You have been signed out.');
    setAuthPassword('');
    setAuthEmail(lastEmail);
  };

  const handleSwitchAccount = () => {
    setCurrentUser(null);
    handleAuthModeChange(AUTH_MODES.login);
  };

  const accountHeading = currentUser ? 'Your Zora account' : authMode === AUTH_MODES.login ? 'Welcome back' : 'Join Zora Cora';
  const accountDescription = currentUser
    ? `You are signed in as ${currentUser.email}. Use the options below to manage your session.`
    : authMode === AUTH_MODES.login
      ? 'Log in to access personalised recommendations and community features.'
      : 'Create an account to save favourites and participate in the community forums.';

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
            sx={{ height: 36 }}
          />
          <Tabs
            value={activeSection}
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
            <Tab label="Products" value={MAIN_SECTIONS.products} />
            <Tab label="Forums" value={MAIN_SECTIONS.forums} />
            <Tab label="Account" value={MAIN_SECTIONS.account} />
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
              Log in
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
              Create account
            </Button>
          </Box>
        </Toolbar>

        {activeSection === MAIN_SECTIONS.products && (
          <Box
            sx={{
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
                  color: designTokens.colors.textSecondary,
                  transition: theme =>
                    theme.transitions.create(['color', 'background-color'], {
                      duration: theme.transitions.duration.short,
                    }),
                  '&:hover': {
                    backgroundColor: designTokens.colors.subheaderTabHover,
                  },
                  '&.Mui-selected': {
                    backgroundColor: designTokens.colors.subheaderTabActive,
                    color: designTokens.colors.textPrimary,
                  },
                },
              }}
            >
              <Tab label="All" value={ALL_CATEGORY} />
              {categories.map(category => (
                <Tab key={category} label={category} value={category} />
              ))}
            </Tabs>
          </Box>
        )}
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {activeSection === MAIN_SECTIONS.products && (
          <>
            <Typography variant="h3" component="h1" gutterBottom>
              Zora Collection
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 4, color: 'common.black' }}>
              Curated home goods crafted by independent artisans. Updated daily from the Zora API.
            </Typography>

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
              <Alert severity="info">No products available in this category yet.</Alert>
            )}

            <Grid container spacing={3}>
              {filteredProducts.map(product => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box
                      sx={{
                        pt: '56.25%',
                        backgroundImage: `linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(236, 72, 153, 0.15)), url(${product.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{ fontSize: { xs: "1.25rem", md: "1.4rem" }, color: PRODUCT_NAME_COLOR }}
                        >
                          {product.name}
                        </Typography>
                        <Chip
                          label={`$${product.price.toFixed(2)}`}
                          size="medium"
                          variant="outlined"
                          sx={{
                            backgroundColor: designTokens.colors.priceTagBackground,
                            color: designTokens.colors.priceTagText,
                            borderColor: designTokens.colors.priceTagBackground,
                            fontWeight: 600,
                            fontSize: designTokens.sizes.priceTag.fontSize,
                            px: designTokens.sizes.priceTag.paddingX,
                            py: designTokens.sizes.priceTag.paddingY,
                            borderRadius: designTokens.sizes.priceTag.borderRadius,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {product.description}
                      </Typography>
                      <Chip
                        label={product.category}
                        size="small"
                        sx={{
                          backgroundColor: designTokens.colors.categoryChipBackground,
                          color: designTokens.colors.categoryChipText,
                          fontWeight: 600,
                          px: 1.25,
                          py: 0.5,
                          borderRadius: '999px',
                        }}
                      />

                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="large"
                        variant="contained"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: designTokens.colors.viewDetailsButton,
                          color: designTokens.colors.viewDetailsButtonText,
                          fontSize: designTokens.sizes.viewDetailsButton.fontSize,
                          px: designTokens.sizes.viewDetailsButton.paddingX,
                          py: designTokens.sizes.viewDetailsButton.paddingY,
                          borderRadius: designTokens.sizes.viewDetailsButton.borderRadius,
                          '&:hover': {
                            backgroundColor: designTokens.colors.viewDetailsButtonHover,
                          },
                        }}
                      >
                        View details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {activeSection === MAIN_SECTIONS.forums && (
          <Stack spacing={3} alignItems="stretch">
            <Typography variant="h3" component="h1">
              Community Forums
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'common.black', maxWidth: 520 }}>
              Explore discussion spaces that feel like a tidy directory of workshops. Choose a folder to meet the people
              behind Zora or tap into AI-powered explainers.
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <List
                component="nav"
                disablePadding
                subheader={
                  <ListSubheader component="div" sx={{ fontWeight: 600 }}>
                    Forums Directory
                  </ListSubheader>
                }
              >
                {forumFolders.map((folder, index) => (
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
                    {index < forumFolders.length - 1 && <Divider component="li" />}
                  </Fragment>
                ))}
              </List>
            </Paper>
            <Button variant="contained" size="large" sx={{ alignSelf: 'flex-start' }}>
              Request Early Access
            </Button>
          </Stack>
        )}
        {activeSection === MAIN_SECTIONS.account && (
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
                    onClick={() => handleAuthModeChange(AUTH_MODES.login)}
                    disabled={authLoading}
                  >
                    Log in
                  </Button>
                  <Button
                    variant={authMode === AUTH_MODES.register ? 'contained' : 'text'}
                    onClick={() => handleAuthModeChange(AUTH_MODES.register)}
                    disabled={authLoading}
                  >
                    Create account
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
                    <Typography variant="h6">You're signed in</Typography>
                    <Typography color="text.secondary">{currentUser.email}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <Button variant="contained" onClick={handleLogout}>
                        Sign out
                      </Button>
                      <Button variant="outlined" onClick={handleSwitchAccount}>
                        Switch account
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Stack>
            ) : (
              <Paper
                variant="outlined"
                sx={{ p: { xs: 3, sm: 4 } }}
                component="form"
                onSubmit={handleAuthSubmit}
              >
                <Stack spacing={2.5}>
                  <TextField
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    required
                    value={authEmail}
                    onChange={event => setAuthEmail(event.target.value)}
                    disabled={authLoading}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    autoComplete={authMode === AUTH_MODES.login ? 'current-password' : 'new-password'}
                    helperText="Use at least 8 characters."
                    required
                    value={authPassword}
                    onChange={event => setAuthPassword(event.target.value)}
                    disabled={authLoading}
                  />
                  <Button type="submit" variant="contained" size="large" disabled={authLoading}>
                    {authLoading
                      ? 'Please wait...'
                      : authMode === AUTH_MODES.login
                        ? 'Log in'
                        : 'Create account'}
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
          )
        }
      </Container>
    </>
  );
}
