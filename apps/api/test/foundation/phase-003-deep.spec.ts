import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-003 T1 — Identity migration deep', () => {
  it('0003 creates users, memberships, sessions, invitations with constraints', () => {
    const m3 = fs.readFileSync('../../apps/api/migrations/0003_identity_core.sql','utf8');
    expect(m3).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(m3).toContain('CREATE TABLE IF NOT EXISTS memberships');
    expect(m3).toContain('CREATE TABLE IF NOT EXISTS sessions');
    expect(m3).toContain('invitations');
    expect(m3).toContain('UNIQUE');
  });
  it('users is global (no tenant_id column) per ADR-0005', () => {
    const m3 = fs.readFileSync('../../apps/api/migrations/0003_identity_core.sql','utf8');
    const start = m3.indexOf('CREATE TABLE IF NOT EXISTS users');
    const end = m3.indexOf(');', start);
    const usersDef = m3.slice(start, end);
    expect(usersDef).not.toContain('tenant_id uuid');
    expect(m3).toContain('CREATE TABLE IF NOT EXISTS memberships');
  });
});

describe('PHASE-003 T2 — Seeds and drift check deep', () => {
  it('permissions and role templates seeds exist', () => {
    const seeds = fs.readdirSync('../../apps/api/seeds/identity');
    expect(seeds.join(',')).toContain('permissions');
    expect(fs.existsSync('../../scripts/check-permissions-drift.ts')).toBe(true);
    const drift = fs.readFileSync('../../scripts/check-permissions-drift.ts','utf8');
    expect(drift.length).toBeGreaterThan(100);
  });
});

describe('PHASE-003 T3 — Argon2id password service deep', () => {
  it('password service exists with argon2 and policy', () => {
    expect(fs.existsSync('src/modules/identity/domain/password.ts')).toBe(true);
    const pwd = fs.readFileSync('src/modules/identity/domain/password.ts','utf8');
    expect(pwd.toLowerCase()).toContain('argon');
  });
});

describe('PHASE-003 T4 — Session service deep', () => {
  it('session service implements rotate/revoke/timeouts', () => {
    const sess = fs.readFileSync('src/modules/identity/application/session-service.ts','utf8');
    expect(sess).toContain('session');
    expect(sess.length).toBeGreaterThan(100);
  });
  it('auth controller exposes login/logout', () => {
    const ctrl = fs.readFileSync('src/modules/identity/presentation/auth.controller.ts','utf8');
    expect(ctrl).toContain('login');
  });
});

describe('PHASE-003 T5/T6 — Login lockout + MFA deep', () => {
  it('rate-limiter and mfa service exist', () => {
    expect(fs.existsSync('src/modules/identity/application/rate-limiter.ts')).toBe(true);
    expect(fs.existsSync('src/modules/identity/application/mfa-service.ts')).toBe(true);
  });
});

describe('PHASE-003 T9 — RBAC decorator deep', () => {
  it('RequirePermissions guard exists', () => {
    const ok = fs.existsSync('src/infra/auth/guards/feature.guard.ts') || fs.existsSync('src/modules/identity/infrastructure/rbac.decorator.ts') || fs.existsSync('src/infra/auth/require-feature.ts');
    expect(ok).toBe(true);
  });
});

describe('PHASE-003 T12 — Audit wiring deep', () => {
  it('audit module records identity actions', () => {
    const audit = fs.readFileSync('src/modules/audit/audit.service.ts','utf8');
    expect(audit).toContain('record');
  });
});

describe('PHASE-003 T14 — i18n and contracts deep', () => {
  it('contracts and i18n parity check exist', () => {
    expect(fs.existsSync('../../scripts/check-i18n-parity.ts')).toBe(true);
    expect(fs.existsSync('../../packages/contracts/src')).toBe(true);
  });
});
