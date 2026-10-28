import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-017 check 1 — automotive migration exists', () => {
  it('automotive migration exists', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0018_industry_automotive_distribution.sql','utf8');
    expect(m).toContain('service_orders');
  });
});
describe('PHASE-017 check 2 — industry templates include automotive', () => {
  it('industry templates include automotive', () => {
    const c = fs.readFileSync('../../apps/api/migrations/0018_industry_automotive_distribution.sql','utf8');
    expect(c).toContain('industry.automotive');
  });
});