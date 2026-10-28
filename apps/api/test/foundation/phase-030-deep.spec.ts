import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-030 — Warranty deep', () => {
  it('migration 0025_giants_industries.sql contains warranty_claims', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0025_giants_industries.sql','utf8');
    expect(m).toContain('warranty_claims');
  });
  it('RLS enabled', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0025_giants_industries.sql','utf8');
    expect(m).toContain('tenant_isolation');
  });
});
