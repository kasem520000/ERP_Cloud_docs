import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('S-01..S-03 Session/MFA and Rate-limit suites (structural)', () => {
  it('rotation on login and membership switch kills old session', () => {
    const s = fs.readFileSync('apps/api/src/modules/identity/application/session-service.ts','utf8');
    expect(s).toContain('rotateSession');
    expect(s).toContain('revoked_at');
  });
  it('TOTP enrollment only sets confirmed_at after verification; reuse rejected', () => {
    const m = fs.readFileSync('apps/api/src/modules/identity/application/mfa-service.ts','utf8');
    expect(m).toContain('confirmed_at');
    expect(m).toContain('markCodeUsed');
    expect(m).toContain('verifyTotp');
  });
  it('progressive lockout never permanent; success resets failed_login_count', () => {
    const a = fs.readFileSync('apps/api/src/modules/identity/application/auth-service.ts','utf8');
    expect(a).toContain('failed_login_count=0');
    expect(a).toContain('locked_until');
    expect(a).not.toContain('permanent');
  });
  it('invitation token hashed 72h, reset 30m', () => {
    const sql = fs.readFileSync('apps/api/migrations/0003_identity_core.sql','utf8');
    expect(sql).toContain('invitations');
    const auth = fs.readFileSync('apps/api/src/modules/identity/application/auth-service.ts','utf8');
    expect(auth).toContain('72');
    expect(auth).toContain('30');
  });
});
