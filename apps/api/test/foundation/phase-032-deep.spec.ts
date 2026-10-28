import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-032 — Education deep', () => {
  it('migration 0025_giants_industries.sql contains students', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0025_giants_industries.sql','utf8');
    expect(m).toContain('students');
  });
  it('RLS enabled', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0025_giants_industries.sql','utf8');
    expect(m).toContain('tenant_isolation');
  });
});
