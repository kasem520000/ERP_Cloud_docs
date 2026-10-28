import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Minimal migration runner (PHASE-002).
 * Applies SQL files in apps/api/migrations/ sequentially, tracking via _migrations table.
 * Uses MIGRATE_DATABASE_URL (erp_migrate role) if present, else DATABASE_URL.
 */
const dir = fs.existsSync('apps/api/migrations') ? path.resolve('apps/api/migrations') : path.resolve('migrations');

export async function runMigrations(connectionString?: string): Promise<void> {
  const url = connectionString || process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://erp_migrate:erp_migrate@localhost:5432/erp_dev';
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id serial PRIMARY KEY,
        name text NOT NULL UNIQUE,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const applied = new Set((await pool.query('SELECT name FROM _migrations')).rows.map((r: { name: string }) => r.name));
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] skip applied ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`[migrate] applying ${file}`);
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.log(`[migrate] applied ${file}`);
    }
    console.log(`[migrate] done — ${files.length} migrations checked`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().catch(err => { console.error(err); process.exit(1); });
}
