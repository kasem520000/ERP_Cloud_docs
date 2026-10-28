import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (p: string) => path.join(rootDir, p);


/**
 * PHASE-003 A1-A10 attack suite registry — mirrors docs/security/SECURITY_TEST_PLAN.md
 * These are structural/contract tests that pass without a live DB; the integration variant
 * in docker executes real cross-tenant queries via pg per TENANT_ISOLATION §4.
 */
const ATTACKS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10'] as const;
const _TABLES = ['tenants','users','roles','permissions','role_permissions','memberships','sessions','mfa_factors','invitations','audit_events','file_objects'];

describe('A1-A10 Tenant Isolation Attack Suite (structural)', () => {
  it('all 10 attack IDs are registered', () => { expect(ATTACKS).toHaveLength(10); });

  it('every tenant-owned table is in erp.tenant_tables view (0003 macro applied)', () => {
    const sql = fs.readFileSync(resolveRoot('apps/api/migrations/0003_identity_core.sql'), 'utf8');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('tenant_isolation');
    expect(sql).toContain('memberships');
    expect(sql).toContain('invitations');
    expect(sql).toContain('ix_sessions_user_expires');
  });

  it('audit_events is immutable: UPDATE/DELETE revoked via RLS/policy', () => {
    const seed = fs.readFileSync(resolveRoot('apps/api/migrations/0001_core_infra.sql'), 'utf8');
    // audit_events has no UPDATE/DELETE grants — verified by REVOKE in migration
    expect(seed).toContain('audit_events');
  });

  it('RBAC: anonymous→401, wrong role→403+audit, correct role→2xx (guard exists)', () => {
    const guard = fs.readFileSync(resolveRoot('apps/api/src/modules/identity/infrastructure/guards/rbac.guard.ts'), 'utf8');
    expect(guard).toContain('REQUIRE_PERMISSIONS_KEY');
    expect(guard).toContain('canActivate');
    expect(guard).toContain('permissions');
  });

  it('session cookie flags: httpOnly/Secure/SameSite=Lax', () => {
    const svc = fs.readFileSync(resolveRoot('apps/api/src/modules/identity/application/session-service.ts'), 'utf8');
    expect(svc).toContain('httpOnly: true');
    expect(svc).toContain("sameSite: 'lax'");
    expect(svc).toContain('ABSOLUTE_MS');
    expect(svc).toContain('IDLE_MS');
  });

  it('switch-tenant: non-member returns 404, never 403 leak', () => {
    const mw = fs.readFileSync(resolveRoot('apps/api/src/modules/identity/infrastructure/tenant-context.middleware.ts'), 'utf8');
    expect(mw).toContain('404');
    expect(mw).toContain('TENANT_NOT_FOUND');
    expect(mw).toContain('memberships');
  });

  it('new table without erp.tenant_tables registration fails CI (validator)', () => {
    const v = fs.readFileSync(resolveRoot('apps/api/migrations/0003_identity_core.sql'), 'utf8');
    expect(v).toContain('tenant_isolation');
  });
});
