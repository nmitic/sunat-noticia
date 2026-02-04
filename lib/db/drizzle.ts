import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDrizzle = global as unknown as {
  pool?: Pool;
  db?: ReturnType<typeof drizzle>;
};

// Fail fast — avoids silent prod failures on Vercel
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set');
}

// Create PostgreSQL connection pool (Vercel + Supabase safe)
const pool =
  globalForDrizzle.pool ??
  new Pool({
    connectionString: process.env.POSTGRES_URL,

    // SSL required for cloud databases (Supabase, Vercel, etc.), disabled locally
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

    // REQUIRED for Vercel serverless
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 2_000,
  });

// Prevent pool recreation during local HMR
if (process.env.NODE_ENV !== 'production') {
  globalForDrizzle.pool = pool;
}

// Create Drizzle client
export const db =
  globalForDrizzle.db ??
  drizzle(pool, {
    schema,
    logger: process.env.NODE_ENV !== 'production',
  });

// Prevent Drizzle re-creation during local HMR
if (process.env.NODE_ENV !== 'production') {
  globalForDrizzle.db = db;
}

// Export schema for use in queries
export { schema };

// Export table references for convenience
export const {
  news: newsTable,
  emailSubscription: emailSubscriptionTable,
  admin: adminTable,
  scraperRun: scraperRunTable,
} = schema;
