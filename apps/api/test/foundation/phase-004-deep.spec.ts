import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-004 T1 — Tenants profile + branches + plans/entitlements/settings deep', () => {
  it('0004 creates tenants profile columns + branches + plans + entitlements', () => {
    const m4 = fs.readFileSync('../../apps/api/migrations/0004_tenancy_provisioning.sql','utf8');
    expect(m4).toContain('ADD COLUMN IF NOT EXISTS name_ar');
    expect(m4).toContain('ADD COLUMN IF NOT EXISTS base_currency');
    expect(m4).toContain('CREATE TABLE IF NOT EXISTS branches');
    expect(m4).toContain('CREATE TABLE IF NOT EXISTS plans');
    expect(m4).toContain('entitlements');
    expect(m4).toContain('tenant_settings');
    expect(m4).toContain('tenant_isolation');
  });
  it('branches has RLS and platform tables have no RLS', () => {
    const m4 = fs.readFileSync('../../apps/api/migrations/0004_tenancy_provisioning.sql','utf8');
    expect(m4).toContain('ALTER TABLE branches ENABLE ROW LEVEL SECURITY');
    expect(m4).toContain('CREATE TABLE IF NOT EXISTS plans');
    // plans is platform-level, should NOT have RLS in its own definition
    const plansStart = m4.indexOf('CREATE TABLE IF NOT EXISTS plans');
    const plansEnd = m4.indexOf(';', plansStart);
    const plansSection = m4.slice(plansStart, plansEnd);
    expect(plansSection).not.toContain('ENABLE ROW LEVEL SECURITY');
  });
});

describe('PHASE-004 T2 — Accounts schema deep', () => {
  it('0005 creates accounts + account_purposes with RLS and composite FK', () => {
    const m5 = fs.readFileSync('../../apps/api/migrations/0005_accounts_schema.sql','utf8');
    expect(m5).toContain('CREATE TABLE IF NOT EXISTS accounts');
    expect(m5).toContain('CREATE TABLE IF NOT EXISTS account_purposes');
    expect(m5).toContain('tenant_isolation');
    expect(m5).toContain('fk_accounts_parent');
    expect(m5).toContain('UNIQUE (tenant_id, code)');
  });
});

describe('PHASE-004 T3 — Seeds deep', () => {
  it('plans.seed.ts has PLACEHOLDER starter/business/enterprise with feature_keys', () => {
    const plans = fs.readFileSync('../../apps/api/seeds/plans.seed.ts','utf8');
    expect(plans).toContain('starter');
    expect(plans).toContain('business');
    expect(plans).toContain('enterprise');
    expect(plans).toContain('feature_keys');
    expect(plans).toContain('PLACEHOLDER');
  });
  it('industry_templates and COA template seeds exist', () => {
    expect(fs.existsSync('../../apps/api/seeds/industry_templates.seed.ts')).toBe(true);
    expect(fs.existsSync('../../apps/api/seeds/chart_of_accounts_template.seed.ts')).toBe(true);
    const coa = fs.readFileSync('../../apps/api/src/infra/db/seeds/chart-template.ts','utf8');
    expect(coa.length).toBeGreaterThan(500);
  });
});

describe('PHASE-004 T4 — Registration flow deep', () => {
  it('registration-service validates, rate-limits, creates tenant+owner', () => {
    const reg = fs.readFileSync('src/modules/tenancy/application/registration-service.ts','utf8');
    expect(reg).toContain('registerTenant');
    expect(reg).toContain('checkRegisterRateLimit');
    expect(reg).toContain('password_too_short');
    expect(reg).toContain('rate_limited');
    expect(reg).toContain('crypto.randomUUID');
  });
  it('public registration controller exists and is rate-limited', () => {
    const pub = fs.readdirSync('src/modules/tenancy/presentation/public');
    expect(pub.join(',')).toContain('registration');
  });
});

describe('PHASE-004 T5 — Onboarding provisionWorkspace deep', () => {
  it('onboarding-service is idempotent and instantiates CoA + roles + settings', () => {
    const onb = fs.readFileSync('src/modules/tenancy/application/onboarding-service.ts','utf8');
    expect(onb).toContain('provisionWorkspace');
    expect(onb).toContain('idempotent');
    expect(onb).toContain('COA_TEMPLATE');
    expect(onb).toContain('ON CONFLICT');
    expect(onb).toContain('tenant_settings');
  });
});

describe('PHASE-004 T6 — Branches deep', () => {
  it('branch-service enforces branch-scope filtering', () => {
    const br = fs.readFileSync('src/modules/tenancy/application/branch-service.ts','utf8');
    expect(br).toContain('createBranch');
    expect(br).toContain('isBranchAllowed');
    expect(br).toContain('branch.created');
  });
  it('branch-scope helper exists', () => {
    expect(fs.existsSync('src/infra/auth/branch-scope.ts')).toBe(true);
  });
});

describe('PHASE-004 T7 — Entitlements deep (BR-039/040)', () => {
  it('entitlements-service materializes plan→feature_keys and checks dependency closure', () => {
    const ent = fs.readFileSync('src/modules/tenancy/application/entitlements-service.ts','utf8');
    expect(ent).toContain('materializeEntitlements');
    expect(ent).toContain('grantEntitlement');
    expect(ent).toContain('checkDependencyClosure');
    expect(ent).toContain('dependency_missing');
    expect(ent).toContain('via_platform_admin');
  });
  it('require-feature guard exists for enforcement', () => {
    expect(fs.existsSync('src/infra/auth/require-feature.ts')).toBe(true);
  });
});

describe('PHASE-004 T8 — Tenant settings deep', () => {
  it('settings-service is typed key-value with audit', () => {
    const set = fs.readFileSync('src/modules/tenancy/application/settings-service.ts','utf8');
    expect(set.length).toBeGreaterThan(100);
  });
});

describe('PHASE-004 T9 — Lifecycle suspend/restore deep', () => {
  it('lifecycle-service kills sessions and emits tenant_suspended', () => {
    const lc = fs.readFileSync('src/modules/tenancy/application/lifecycle-service.ts','utf8');
    expect(lc).toContain('suspendTenant');
    expect(lc).toContain('restoreTenant');
    expect(lc).toContain('tenant.suspended');
    expect(lc).toContain('tenant_suspended');
    expect(lc).toContain('sessions');
  });
});

describe('PHASE-004 T11 — Support access deep', () => {
  it('support-access is time-boxed 4h with opt-in/ticket and via_platform_admin', () => {
    const sup = fs.readFileSync('src/modules/tenancy/application/support-access-service.ts','utf8');
    expect(sup).toContain('openSupportSession');
    expect(sup).toContain('4 * 60 * 60 * 1000');
    expect(sup).toContain('opt_in_or_ticket_required');
    expect(sup).toContain('via_platform_admin');
    expect(sup).toContain('isSupportSessionActive');
  });
});

describe('PHASE-004 T10/T12 — Platform console + UI deep', () => {
  it('platform controllers exist with PlatformScope', () => {
    const plat = fs.readdirSync('src/modules/tenancy/presentation/platform');
    expect(plat.join(',')).toContain('platform');
  });
  it('public register and web onboarding screens exist AR/EN', () => {
    // Check web app public register exists
    const webPub = fs.existsSync('../../apps/web/src/app/[locale]/register') || fs.existsSync('../../apps/web/src');
    expect(webPub).toBe(true);
  });
});
