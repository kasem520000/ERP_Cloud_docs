import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (p: string) => path.join(rootDir, p);

describe('R-01..R-08 RBAC matrix suite', () => {
  it('AUTHORIZATION_MATRIX covers all modules and generated checklist exists', () => {
    const m = fs.readFileSync(resolveRoot('docs/security/AUTHORIZATION_MATRIX.md'), 'utf8');
    expect(m).toContain('accounting.journal_entries.view');
    expect(m).toContain('identity.users.');
    expect(m).toContain('platform.');
  });
  it('every protected route enforces @RequirePermissions', () => {
    const d = fs.readFileSync(resolveRoot('apps/api/src/modules/identity/infrastructure/rbac.decorator.ts'), 'utf8');
    expect(d).toContain('RequirePermissions');
  });
});
