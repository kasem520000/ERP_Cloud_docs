import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-025 check 1 — benchmarks table', () => {
  it('benchmarks table', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0023_security_performance.sql','utf8');
    expect(m).toContain('benchmarks');
  });
});
describe('PHASE-025 check 2 — load tests exist', () => {
  it('load tests exist', () => {
    expect(fs.existsSync('../../k6')).toBe(true);
  });
});