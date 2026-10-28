#!/usr/bin/env tsx
/**
 * check-rls.ts — CI test that every table with tenant_id has RLS + policy (PHASE-002 T4)
 * Fails the build if a tenant-owned table lacks RLS (negative proof for probe table).
 * Also used by migration tests to assert audit_events/_infra_probe have policies.
 */
import { Pool } from 'pg';

async function main(): Promise<void> {
  const connectionString = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://erp_migrate:erp_migrate@localhost:5432/erp_dev';
  const pool = new Pool({ connectionString });
  try {
    // Find all tables with tenant_id column
    const tenantTables = await pool.query(`
      SELECT table_name FROM information_schema.columns
      WHERE column_name = 'tenant_id' AND table_schema = 'public'
    `);
    const tables: string[] = tenantTables.rows.map((r: {table_name:string}) => r.table_name);
    if (tables.length === 0) {
      console.log('check-rls: no tenant tables found — skipping (empty DB? ensure migrations applied)');
      return;
    }
    console.log(`check-rls: found tenant tables: ${tables.join(', ')}`);
    let failed = false;
    for (const t of tables) {
      // Check RLS enabled + forced
      const rel = await pool.query(`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = $1`, [t]);
      if (rel.rows.length === 0) { console.error(`  ✗ ${t}: table not in pg_class`); failed = true; continue; }
      const { relrowsecurity, relforcerowsecurity } = rel.rows[0];
      if (!relrowsecurity) { console.error(`  ✗ ${t}: RLS not enabled`); failed = true; } else console.log(`  ✓ ${t}: RLS enabled`);
      if (!relforcerowsecurity) { console.error(`  ✗ ${t}: RLS not forced`); failed = true; } else console.log(`  ✓ ${t}: FORCE RLS`);

      const pol = await pool.query(`SELECT policyname FROM pg_policies WHERE tablename = $1 AND policyname = 'tenant_isolation'`, [t]);
      if (pol.rows.length === 0) { console.error(`  ✗ ${t}: missing tenant_isolation policy`); failed = true; }
      else {
        const def = await pool.query(`SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = $1`, [t]);
        const hasUsing = def.rows.some((r: {qual:string}) => r.qual && r.qual.includes('current_tenant_id'));
        const hasCheck = def.rows.some((r: {with_check:string}) => r.with_check && r.with_check.includes('current_tenant_id'));
        if (!hasUsing) console.error(`  ✗ ${t}: policy missing USING current_tenant_id`); else console.log(`  ✓ ${t}: USING check`);
        if (!hasCheck) console.error(`  ✗ ${t}: policy missing WITH CHECK current_tenant_id`); else console.log(`  ✓ ${t}: WITH CHECK`);
        if (!hasUsing || !hasCheck) failed = true;
      }
    }
    if (failed) {
      console.error('check-rls: FAILED — some tenant tables lack proper RLS');
      process.exit(1);
    }
    console.log('check-rls: PASSED — all tenant tables have RLS + policies');
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
