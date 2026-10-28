import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-021 check 1 — desktop README points to PHASE-021', () => {
  it('desktop README points to PHASE-021', () => {
    const c = fs.readFileSync('../../apps/desktop/README.md','utf8');
    expect(c).toContain('PHASE-021');
  });
});
describe('PHASE-021 check 2 — desktop shell scaffold', () => {
  it('desktop shell scaffold', () => {
    expect(fs.existsSync('../../apps/desktop')).toBe(true);
  });
});