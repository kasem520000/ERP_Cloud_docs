import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-018 check 1 — manufacturing migration BOMs', () => {
  it('manufacturing migration BOMs', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0019_manufacturing.sql','utf8');
    expect(m).toContain('boms');
  });
});
describe('PHASE-018 check 2 — manufacturing template exists', () => {
  it('manufacturing template exists', () => {
    const c = fs.readFileSync('../../apps/api/seeds/industry_templates.seed.ts','utf8');
    expect(c).toContain('manufacturing');
  });
});