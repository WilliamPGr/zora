import 'dotenv/config';
import { Pool } from 'pg';
import { ensureDatabase } from '../lib/database.js';

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
  try {
    const { seededProducts } = await ensureDatabase(pool, { withSeed: true });
    if (seededProducts > 0) {
      console.log(`Database seed complete: upserted ${seededProducts} products`);
    } else {
      console.log('Database schema ensured (no product updates required)');
    }
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Failed to initialise database', error);
  process.exitCode = 1;
});
