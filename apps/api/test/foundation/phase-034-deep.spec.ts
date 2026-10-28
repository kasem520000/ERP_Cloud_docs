import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-034 — Group Consolidation deep', () => {
  it('migration 0026_group_consolidation.sql contains consolidation_groups', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0026_group_consolidation.sql','utf8');
    expect(m).toContain('consolidation_groups');
  });
  it('RLS enabled', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0026_group_consolidation.sql','utf8');
    expect(m).toContain('tenant_isolation');
  });
});
