#!/usr/bin/env tsx
/**
 * check-catalog-drift.ts — fails if a migration creates a tenant-owned table without ENTITY_CATALOG entry (PHASE-002 T4/T9)
 * Seeded with current catalog content (tenants, audit_events, file_objects, _infra_probe allowed).
 */
import fs from 'node:fs';

const CATALOG = fs.readFileSync('docs/database/ENTITY_CATALOG.md','utf8');
const allowedTables = ['tenants','audit_events','file_objects','_infra_probe','boss','_migrations'];
// Also parse catalog for any backtick-quoted table names
const catalogTables = [...CATALOG.matchAll(/`([a-z_]+)`/g)].map(m => m[1]);
const known = new Set([...allowedTables, ...catalogTables]);

console.log(`check-catalog-drift: known tables from catalog + allowed: ${[...known].slice(0,20).join(', ')}...`);

const migrationFiles = fs.readdirSync('apps/api/migrations').filter(f=>f.endsWith('.sql'));
let drift = false;
for (const file of migrationFiles) {
  const sql = fs.readFileSync(`apps/api/migrations/${file}`,'utf8');
  const creates = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/g)].map(m=>m[1].toLowerCase());
  for (const tbl of creates) {
    if (!known.has(tbl) && !tbl.startsWith('_infra') && tbl !== 'boss') {
      console.error(`  ✗ ${file}: creates tenant table '${tbl}' not in ENTITY_CATALOG`);
      drift = true;
    } else {
      console.log(`  ✓ ${file}: table '${tbl}' accounted for`);
    }
  }
}
if (drift) { console.error('check-catalog-drift: FAILED — add new tables to ENTITY_CATALOG.md'); process.exit(1); }
console.log('check-catalog-drift: PASSED');
