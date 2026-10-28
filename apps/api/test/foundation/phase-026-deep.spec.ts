import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-026 — Fixed Assets deep', () => {
  it('migration 0024_giants_core.sql contains fixed_assets', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0024_giants_core.sql','utf8');
    expect(m).toContain('fixed_assets');
  });
  it('RLS enabled', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0024_giants_core.sql','utf8');
    expect(m).toContain('tenant_isolation');
  });
});
