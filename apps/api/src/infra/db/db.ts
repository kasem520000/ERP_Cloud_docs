import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

let pool: Pool | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function createPool(connectionString?: string): Pool {
  const url = connectionString || process.env.DATABASE_URL || 'postgresql://erp_app:erp_app@localhost:5432/erp_dev';
  pool = new Pool({
    connectionString: url,
    max: 20,
    statement_timeout: 15000,
    application_name: 'erp-api',
  });
  return pool;
}

export function getPool(): Pool {
  if (!pool) return createPool();
  return pool;
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (dbInstance) return dbInstance;
  const p = getPool();
  dbInstance = drizzle(p, { schema });
  return dbInstance;
}

export { schema };

export function closePool(): Promise<void> {
  if (pool) return pool.end();
  return Promise.resolve();
}
