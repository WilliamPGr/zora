import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'db.json');

async function loadProducts() {
  const buffer = await readFile(dataPath, 'utf-8');
  const parsed = JSON.parse(buffer);
  return Array.isArray(parsed.products) ? parsed.products : [];
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zora-api' });
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const products = await loadProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.get('/api/products/:id', async (req, res, next) => {
  try {
    const products = await loadProducts();
    const product = products.find(item => String(item.id) === req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(port, () => {
  console.log(`Zora API running on http://localhost:${port}`);
});
