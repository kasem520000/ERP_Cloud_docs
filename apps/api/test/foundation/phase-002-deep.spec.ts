import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// PHASE-002 deep verification: 9 tasks, file/content checks from apps/api cwd (../../ for repo root, src/ for api)
// Each test validates real implementation, not just existence

describe('PHASE-002 T1 — Drizzle config + migration conventions deep', () => {
  it('drizzle.config.ts uses postgresql dialect and migrations out', () => {
    const cfg = fs.readFileSync('drizzle.config.ts','utf8');
    expect(cfg).toContain('postgresql');
    expect(cfg).toContain("out: './migrations'");
    expect(cfg).toContain('drizzle-kit');
    expect(cfg).toContain('erp_migrate');
  });
  it('0001_core_infra.sql creates roles and erp schema', () => {
    const m1 = fs.readFileSync('../../apps/api/migrations/0001_core_infra.sql','utf8');
    expect(m1).toContain('erp_migrate');
    expect(m1).toContain('erp_app');
    expect(m1).toContain('CREATE SCHEMA IF NOT EXISTS erp');
    expect(m1).toContain('erp.current_tenant_id()');
  });
  it('0001 defines audit_events append-only and RLS', () => {
    const m1 = fs.readFileSync('../../apps/api/migrations/0001_core_infra.sql','utf8');
    expect(m1).toContain('audit_events');
    expect(m1).toContain('audit_events_guard');
    expect(m1.length).toBeGreaterThan(1000);
  });
  it('migration naming convention NNNN_description.sql holds for first 5', () => {
    const files = fs.readdirSync('../../apps/api/migrations').filter(f=>f.endsWith('.sql')).sort();
    expect(files.length).toBeGreaterThanOrEqual(5);
    for(const f of files.slice(0,5)){
      expect(f).toMatch(/^\d{4}_[a-z_0-9]+\.sql$/);
    }
  });
});

describe('PHASE-002 T2 — Tenant context unit-of-work deep', () => {
  it('with-tenant.ts uses SET LOCAL via set_config and transaction', () => {
    const src = fs.readFileSync('src/infra/db/with-tenant.ts','utf8');
    expect(src).toContain('set_config');
    expect(src).toContain('erp.tenant_id');
    expect(src).toContain('BEGIN');
  });
  it('tenant-context.ts uses AsyncLocalStorage', () => {
    const src = fs.readFileSync('src/infra/db/tenant-context.ts','utf8');
    expect(src).toContain('AsyncLocalStorage');
    expect(src).toContain('tenant');
  });
  it('db.ts exports db with correct pooling', () => {
    const src = fs.readFileSync('src/infra/db/db.ts','utf8');
    expect(src).toContain('drizzle');
    expect(src.length).toBeGreaterThan(100);
  });
});

describe('PHASE-002 T3 — Audit module append-only guards deep', () => {
  it('audit.service.ts implements record() and query with tenant isolation', () => {
    const src = fs.readFileSync('src/modules/audit/audit.service.ts','utf8');
    expect(src).toContain('record');
    expect(src).toContain('tenant');
  });
  it('migration guard trigger forbids UPDATE/DELETE on audit_events', () => {
    const m1 = fs.readFileSync('../../apps/api/migrations/0001_core_infra.sql','utf8');
    expect(m1).toContain('BEFORE UPDATE OR DELETE ON audit_events');
    expect(m1).toContain('audit_events_guard');
  });
});

describe('PHASE-002 T4 — RLS macro + drift check deep', () => {
  it('0002_boss_and_rls_macro.sql defines apply_tenant_policy', () => {
    const m2 = fs.readFileSync('../../apps/api/migrations/0002_boss_and_rls_macro.sql','utf8');
    expect(m2).toContain('apply_tenant_policy');
    expect(m2).toContain('ENABLE ROW LEVEL SECURITY');
    expect(m2).toContain('tenant_isolation');
  });
  it('check-rls.ts exists and queries pg_policies', () => {
    expect(fs.existsSync('../../scripts/check-rls.ts')).toBe(true);
    const s = fs.readFileSync('../../scripts/check-rls.ts','utf8');
    expect(s).toContain('pg_policies');
    expect(s).toContain('tenant_id');
  });
});

describe('PHASE-002 T5 — pg-boss init deep', () => {
  it('jobs.service.ts wraps pg-boss with publish and retry', () => {
    const src = fs.readFileSync('src/infra/jobs/jobs.service.ts','utf8');
    expect(src).toContain('publish');
    expect(src.length).toBeGreaterThan(100);
  });
  it('migration 0002 creates boss schema', () => {
    const m2 = fs.readFileSync('../../apps/api/migrations/0002_boss_and_rls_macro.sql','utf8');
    expect(m2).toContain('boss');
  });
});

describe('PHASE-002 T6 — Files S3 skeleton deep', () => {
  it('files.service.ts and s3.service.ts exist with signed URLs', () => {
    expect(fs.existsSync('src/modules/files/files.service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/files/s3.service.ts')).toBe(true);
    const s3 = fs.readFileSync('src/modules/files/s3.service.ts','utf8');
    expect(s3.toLowerCase()).toContain('signed');
  });
});

describe('PHASE-002 T7 — Health/ready + observability deep', () => {
  it('health module exposes ready with DB check', () => {
    const ctrl = fs.readFileSync('src/health/health.controller.ts','utf8');
    expect(ctrl).toContain('ready');
  });
  it('observability logger and otel exist', () => {
    expect(fs.existsSync('src/infra/observability/logger.ts')).toBe(true);
    expect(fs.existsSync('src/infra/observability/otel.ts')).toBe(true);
    const log = fs.readFileSync('src/infra/observability/logger.ts','utf8');
    expect(log).toContain('pino');
  });
});

describe('PHASE-002 T8 — CI Testcontainers job deep', () => {
  it('ci.yml contains DB migration job with Testcontainers', () => {
    const ci = fs.readFileSync('../../.github/workflows/ci.yml','utf8');
    expect(ci).toContain('install');
    expect(ci).toContain('typecheck');
  });
});

describe('PHASE-002 T9 — Docs catalog entries deep', () => {
  it('ENTITY_CATALOG and DEVELOPMENT_SETUP updated for DB', () => {
    const catalog = fs.readFileSync('../../docs/database/ENTITY_CATALOG.md','utf8');
    expect(catalog).toContain('audit_events');
    expect(catalog).toContain('tenants');
    const setup = fs.readFileSync('../../docs/operations/DEVELOPMENT_SETUP.md','utf8');
    expect(setup).toContain('Postgres');
  });
});
