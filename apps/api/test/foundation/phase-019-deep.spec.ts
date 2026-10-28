import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-019 check 1 — crm migration leads/projects', () => {
  it('crm migration leads/projects', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0020_crm_projects.sql','utf8');
    expect(m).toContain('leads');
  });
});