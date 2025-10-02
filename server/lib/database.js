import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../db.json');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseProductRecord(rawProduct) {
  if (typeof rawProduct !== 'object' || rawProduct === null) {
    return null;
  }

  const { id, name, price, category, description, image } = rawProduct;

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  if (!isNonEmptyString(name) || !isNonEmptyString(category) || !isNonEmptyString(description) || !isNonEmptyString(image)) {
    return null;
  }

  const numericPrice = typeof price === 'number' ? price : Number(price);
  if (!Number.isFinite(numericPrice)) {
    return null;
  }

  return {
    id,
    name: name.trim(),
    price: Number(numericPrice.toFixed(2)),
    category: category.trim(),
    description: description.trim(),
    image: image.trim(),
  };
}

async function loadSeedProducts() {
  const buffer = await readFile(dataPath, 'utf-8');
  const manifest = JSON.parse(buffer);

  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.products)) {
    return [];
  }

  return manifest.products
    .map(parseProductRecord)
    .filter((product) => product !== null);
}

async function ensureTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function seedProductsTable(client, products) {
  if (!products.length) {
    return 0;
  }

  let seededCount = 0;
  for (const product of products) {
    await client.query(
      `INSERT INTO products (id, name, price, category, description, image)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           price = EXCLUDED.price,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           image = EXCLUDED.image`,
      [
        product.id,
        product.name,
        product.price,
        product.category,
        product.description,
        product.image,
      ],
    );
    seededCount += 1;
  }

  return seededCount;
}

export async function ensureDatabase(pool, options = {}) {
  const { withSeed = false } = options;
  const products = withSeed ? await loadSeedProducts() : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureTables(client);

    let seededProducts = 0;
    if (withSeed) {
      seededProducts = await seedProductsTable(client, products);
    }

    await client.query('COMMIT');
    return { seededProducts };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
