import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-020 check 1 — offline devices table', () => {
  it('offline devices table', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0021_offline_sync.sql','utf8');
    expect(m).toContain('devices');
  });
});
describe('PHASE-020 check 2 — desktop shell exists', () => {
  it('desktop shell exists', () => {
    expect(fs.existsSync('../../apps/desktop/README.md')).toBe(true);
  });
});