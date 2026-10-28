import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (pp: string) => path.join(rootDir, pp);

describe('PHASE-004 Tenancy Provisioning', () => {
  it('tenants additive migration exists with profile columns + status check', () => {
    const sql = fs.readFileSync(resolveRoot('apps/api/migrations/0004_tenancy_provisioning.sql'), 'utf8');
    expect(sql).toContain('name_ar');
    expect(sql).toContain('base_currency');
    expect(sql).toContain('country_code');
    expect(sql).toContain('timezone');
    expect(sql).toContain('industry_template_key');
    expect(sql).toContain('deleted_at');
    expect(sql).toContain(`SUSPENDED`);
    expect(sql).toContain('branches');
    expect(sql).toContain('plans');
    expect(sql).toContain('entitlements');
    expect(sql).toContain('tenant_settings');
    expect(sql).toContain('tenant_isolation');
  });
  it('accounts schema migration exists with RLS + purpose FK', () => {
    const sql = fs.readFileSync(resolveRoot('apps/api/migrations/0005_accounts_schema.sql'), 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS accounts');
    expect(sql).toContain('account_purposes');
    expect(sql).toContain('PURPOSE_NOT_MAPPED');
    expect(sql).toContain('tenant_isolation');
  });
  it('registration endpoint is rate-limited and creates audit', async () => {
    const svc = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/registration-service.ts'), 'utf8');
    expect(svc).toContain('checkRegisterRateLimit');
    expect(svc).toContain('tenant.created');
    expect(svc).toContain('membership.created');
    expect(svc).toContain('rate_limited');
  });
  it('onboarding provisionWorkspace is idempotent', async () => {
    const svc = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/onboarding-service.ts'), 'utf8');
    expect(svc).toContain('idempotent');
    expect(svc).toContain('COA_TEMPLATE');
    expect(svc).toContain('account_purposes');
    expect(svc).toContain('fiscal.start_month');
    expect(svc).toContain('general.default_locale');
  });
  it('branch-scoped membership enforcement exists', async () => {
    const branch = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/branch-service.ts'), 'utf8');
    expect(branch).toContain('isBranchAllowed');
    expect(branch).toContain('branch.created');
    const guard = fs.readFileSync(resolveRoot('apps/api/src/infra/auth/branch-scope.ts'), 'utf8');
    expect(guard).toContain('branch_forbidden');
  });
});
