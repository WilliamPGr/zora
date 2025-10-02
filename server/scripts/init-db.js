import 'dotenv/config';
import { Pool } from 'pg';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../db.json');

const defaultConfig = {
  host: process.env.PGHOST ?? '127.0.0.1',
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? 'zora',
  password: process.env.PGPASSWORD ?? 'zora',
  database: process.env.PGDATABASE ?? 'zora',
};

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : new Pool(defaultConfig);

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
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

    const buffer = await readFile(dataPath, 'utf-8');
    const { products = [] } = JSON.parse(buffer);

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
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${products.length} products`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

