import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
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
import Box from '@mui/material/Box';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const ALL_CATEGORY = 'All';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data: Product[] = await response.json();
        setProducts(data);
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

  const handleTabChange = (_event: SyntheticEvent, value: string) => {
    setActiveCategory(value);
  };

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
        <Toolbar disableGutters sx={{ px: { xs: 2, sm: 4 }, minHeight: 72 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Zora
          </Typography>
          <Tabs
            value={activeCategory}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ ml: { xs: 2, md: 6 } }}
          >
            <Tab label="All" value={ALL_CATEGORY} />
            {categories.map(category => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Zora Collection
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
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
                    <Typography variant="h6" component="h2">
                      {product.name}
                    </Typography>
                    <Chip label={`$${product.price.toFixed(2)}`} color="primary" variant="outlined" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description}
                  </Typography>
                  <Chip label={product.category} size="small" />
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button size="small">View details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
