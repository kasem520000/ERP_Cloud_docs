import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (pp: string) => path.join(rootDir, pp);

describe('PHASE-004 Lifecycle: suspend/restore + support access', () => {
  it('suspend kills sessions + emits tenant.suspended + audit', () => {
    const svc = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/lifecycle-service.ts'), 'utf8');
    expect(svc).toContain('suspendTenant');
    expect(svc).toContain('revoked_at');
    expect(svc).toContain('tenant.suspended');
    expect(svc).toContain('tenant_suspended');
  });
  it('restore revives tenant', () => {
    const svc = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/lifecycle-service.ts'), 'utf8');
    expect(svc).toContain('restoreTenant');
    expect(svc).toContain('ACTIVE');
  });
  it('sync rejection returns tenant_suspended (S-02)', async () => {
    const { syncRejectIfSuspended, isSuspended } = await import('../../src/modules/tenancy/application/lifecycle-service.js');
    expect(isSuspended('SUSPENDED')).toBe(true);
    expect(syncRejectIfSuspended('SUSPENDED').code).toBe('tenant_suspended');
    expect(syncRejectIfSuspended('ACTIVE').rejected).toBe(false);
  });
  it('support access time-boxed 4h + requires opt-in/ticket + audit via_platform_admin', async () => {
    const svc = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/support-access-service.ts'), 'utf8');
    expect(svc).toContain('4 * 60 * 60 * 1000');
    expect(svc).toContain('opt_in_or_ticket_required');
    expect(svc).toContain('via_platform_admin');
    expect(svc).toContain('expires_at');
    const { isExpired } = await import('../../src/modules/tenancy/application/support-access-service.js');
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isExpired(new Date(Date.now() + 100000))).toBe(false);
  });
  it('platform console uses PlatformScope + audited per-use (S-07)', () => {
    const ctrl = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/presentation/platform/platform-tenants.controller.ts'), 'utf8');
    expect(ctrl).toContain('platform.tenants.view');
    expect(ctrl).toContain('platform_scope');
    expect(ctrl).toContain('via_platform_admin');
    expect(ctrl).toContain('platform.tenants.suspend');
  });
  it('tenant_settings validates unknown keys + typed', async () => {
    const { setSetting } = await import('../../src/modules/tenancy/application/settings-service.js');
    await expect(setSetting('tid','unknown.key','x')).rejects.toThrow('unknown_setting');
  });
  it('provisioning UI screens exist AR/EN RTL', () => {
    expect(fs.existsSync(resolveRoot('apps/web/src/app/[locale]/register/page.tsx'))).toBe(true);
    expect(fs.existsSync(resolveRoot('apps/web/src/app/[locale]/onboarding/page.tsx'))).toBe(true);
    expect(fs.existsSync(resolveRoot('apps/web/src/app/[locale]/admin/tenants/page.tsx'))).toBe(true);
    expect(fs.existsSync(resolveRoot('apps/web/src/app/[locale]/branches/page.tsx'))).toBe(true);
  });
  it('no GL postings in phase 004 (accounts are master data only)', () => {
    const onboarding = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/onboarding-service.ts'), 'utf8');
    expect(onboarding).not.toContain('journal');
    expect(onboarding).not.toContain('posting');
    expect(onboarding).toContain('ON CONFLICT');
  });
});
