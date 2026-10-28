import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-016 check 1 — pos migration creates terminals/shifts', () => {
  it('pos migration creates terminals/shifts', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0017_pos_core.sql','utf8');
    expect(m).toContain('pos_terminals');
  });
});
describe('PHASE-016 check 2 — pos module exists', () => {
  it('pos module exists', () => {
    expect(fs.existsSync('src/modules/pos/pos.module.ts')).toBe(true);
  });
});
describe('PHASE-016 check 3 — pos service exists', () => {
  it('pos service exists', () => {
    expect(fs.existsSync('src/modules/pos/application/pos-service.ts')).toBe(true);
  });
});