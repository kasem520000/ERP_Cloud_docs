import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/db/schema/*',
  out: './migrations',
  dbCredentials: {
    url: process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://erp_migrate:erp_migrate@localhost:5432/erp_dev',
  },
  verbose: true,
  strict: true,
});
