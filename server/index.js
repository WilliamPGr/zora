import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

const scrypt = promisify(scryptCallback);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, hashed] = storedHash.split(':');
  if (!salt || !hashed) {
    return false;
  }

  const hashedBuffer = Buffer.from(hashed, 'hex');
  const derivedKey = await scrypt(password, salt, hashedBuffer.length);
  if (hashedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(hashedBuffer, derivedKey);
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

function formatUser(row) {
  return row
    ? {
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
      }
    : null;
}

async function createUserRecord(email, password) {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [email, passwordHash]
  );
  return formatUser(rows[0]);
}

pool.on('error', error => {
  console.error('Unexpected PostgreSQL client error', error);
});

function normaliseProduct(product) {
  return {
    ...product,
    price:
      typeof product.price === 'string' ? Number(product.price) : product.price,
  };
}

async function fetchProducts() {
  const { rows } = await pool.query(
    `SELECT id, name, price, category, description, image
       FROM products
       ORDER BY id ASC`
  );
  return rows.map(normaliseProduct);
}

async function fetchAllData() {
  const products = await fetchProducts();
  return { products };
}
async function fetchProductById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, price, category, description, image
       FROM products
       WHERE id = $1`,
    [id]
  );
  const product = rows[0] ?? null;
  return product ? normaliseProduct(product) : null;
}

app.post('/api/users', async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
    res.status(400).json({ message: 'A valid email is required' });
    return;
  }

  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ message: 'Password must be at least 8 characters' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await createUserRecord(normalizedEmail, password);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'An account with that email already exists' });
      return;
    }

    next(error);
  }
});

app.post('/api/login', async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    res.status(400).json({ message: 'A valid email is required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: 'Password must be at least 8 characters' });
    return;
  }

  try {
    const existingUser = await findUserByEmail(normalizedEmail);

    if (!existingUser) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isValid = await verifyPassword(password, existingUser.password_hash);

    if (!isValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    res.json({ user: formatUser(existingUser) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'zora-api', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.get('/api/data', async (_req, res, next) => {
  try {
    const payload = await fetchAllData();
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

app.get('/api/products/:id', async (req, res, next) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) {
    res.status(400).json({ message: 'Product id must be an integer' });
    return;
  }

  try {
    const product = await fetchProductById(productId);
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
