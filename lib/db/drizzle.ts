import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDrizzle = global as unknown as {
  pool: Pool | undefined;
  db: ReturnType<typeof drizzle> | undefined;
};

// Create PostgreSQL connection pool
const pool =
  globalForDrizzle.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

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
