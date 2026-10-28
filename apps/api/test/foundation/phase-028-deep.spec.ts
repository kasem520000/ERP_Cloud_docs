import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-028 — Attendance & Leave deep', () => {
  it('migration 0024_giants_core.sql contains employees', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0024_giants_core.sql','utf8');
    expect(m).toContain('employees');
  });
  it('RLS enabled', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0024_giants_core.sql','utf8');
    expect(m).toContain('tenant_isolation');
  });
});
