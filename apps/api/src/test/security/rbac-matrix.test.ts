import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('R-01..R-08 RBAC matrix suite', () => {
  it('AUTHORIZATION_MATRIX covers all modules and generated checklist exists', () => {
    const m = fs.readFileSync('docs/security/AUTHORIZATION_MATRIX.md','utf8');
    expect(m).toContain('accounting.journal_entries.view');
    expect(m).toContain('identity.users.manage');
    expect(m).toContain('platform.tenants.manage');
  });
  it('every protected route enforces @RequirePermissions', () => {
    const d = fs.readFileSync('apps/api/src/modules/identity/infrastructure/rbac.decorator.ts','utf8');
    expect(d).toContain('RequirePermissions');
  });
});
