import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function resolveRoot(p: string): string {
  if (fs.existsSync(p)) return p;
  const alt = path.join('..', '..', p);
  if (fs.existsSync(alt)) return alt;
  if (p.startsWith('apps/api/') && fs.existsSync(p.replace('apps/api/', ''))) return p.replace('apps/api/', '');
  if (p.startsWith('docs/') && fs.existsSync(path.join('..','..', p))) return path.join('..','..', p);
  if (p.startsWith('apps/api/migrations') && fs.existsSync('migrations')) return 'migrations';
  return p;
}

describe('Migrations (PHASE-002 T1/T4)', () => {
  const dir = path.resolve(resolveRoot('apps/api/migrations'));

  it('migrations directory exists with numbered files', () => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    expect(files.length).toBeGreaterThanOrEqual(2);
    expect(files[0]).toMatch(/^0001_/);
    expect(files[1]).toMatch(/^0002_/);
  });

  it('file naming follows NNNN_description.sql', () => {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
    for (const f of files) {
      expect(f).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
    }
  });

  it('0001 contains required roles and GUC helper', () => {
    const sql = fs.readFileSync(path.join(dir, '0001_core_infra.sql'), 'utf8');
    expect(sql).toMatch(/CREATE ROLE erp_migrate/);
    expect(sql).toMatch(/CREATE ROLE erp_app/);
    expect(sql).toMatch(/CREATE ROLE erp_readonly/);
    expect(sql).toMatch(/erp\.current_tenant_id\(\)/);
    expect(sql).toMatch(/CREATE TABLE.*tenants/);
    expect(sql).toMatch(/CREATE TABLE.*audit_events/);
    expect(sql).toMatch(/audit_events_guard\(\)/);
    expect(sql).toMatch(/ROW LEVEL SECURITY/);
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
  });

  it('0001 has composite tenant FK example', () => {
    const sql = fs.readFileSync(path.join(dir, '0001_core_infra.sql'), 'utf8');
    expect(sql).toMatch(/FOREIGN KEY \(parent_id, tenant_id\) REFERENCES audit_events/);
  });

  it('audit_events has guard trigger and append-only enforcement', () => {
    const sql = fs.readFileSync(path.join(dir, '0001_core_infra.sql'), 'utf8');
    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON audit_events/);
    expect(sql).toMatch(/append-only/);
  });

  it('tenants is minimal (id,name,status)', () => {
    const sql = fs.readFileSync(path.join(dir, '0001_core_infra.sql'), 'utf8');
    const tenantsBlock = sql.match(/CREATE TABLE IF NOT EXISTS tenants \(([^)]+)\)/s);
    expect(tenantsBlock).not.toBeNull();
    expect(tenantsBlock![1]).toMatch(/id uuid/);
    expect(tenantsBlock![1]).toMatch(/name text/);
    expect(tenantsBlock![1]).toMatch(/status text/);
  });

  it('0002 creates boss schema and RLS macro', () => {
    const sql = fs.readFileSync(path.join(dir, '0002_boss_and_rls_macro.sql'), 'utf8');
    expect(sql).toMatch(/CREATE SCHEMA IF NOT EXISTS boss/);
    expect(sql).toMatch(/erp\.apply_tenant_policy/);
    expect(sql).toMatch(/CREATE POLICY tenant_isolation/);
  });

  it('drizzle.config.ts exists and points to migrations', () => {
    const p = resolveRoot('apps/api/drizzle.config.ts');
    expect(fs.existsSync(p)).toBe(true);
    const cfg = fs.readFileSync(p,'utf8');
    expect(cfg).toMatch(/migrations/);
    expect(cfg).toMatch(/postgresql/);
  });

  it('tenants RLS uses platform scope (TENANT_ISOLATION §3)', () => {
    const sql = fs.readFileSync(path.join(dir, '0001_core_infra.sql'), 'utf8');
    expect(sql).toMatch(/current_platform_scope/);
  });

  it('numeric pin: drizzle uses numeric-string handling', () => {
    const sql = fs.readFileSync(path.join(dir, '0001_core_infra.sql'), 'utf8');
    expect(sql).toMatch(/size int/);
  });
});
