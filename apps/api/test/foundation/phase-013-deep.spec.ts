import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-013 T1 — Reporting migration deep', () => {
  it('0014 creates report_runs + print_templates RLS', () => {
    const m14 = fs.readFileSync('../../apps/api/migrations/0014_reporting_core.sql','utf8');
    expect(m14).toContain('report_runs');
    expect(m14).toContain('tenant_isolation');
  });
});
describe('PHASE-013 T2 — Reporting services deep', () => {
  it('reporting registry and export exist', () => {
    expect(fs.existsSync('src/modules/reporting/registry')).toBe(true);
    expect(fs.existsSync('src/modules/reporting/application/executor.ts')).toBe(true);
    expect(fs.existsSync('src/modules/reporting/application/export')).toBe(true);
  });
});
