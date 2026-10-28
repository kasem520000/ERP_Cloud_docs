import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-024 check 1 — security audit table', () => {
  it('security audit table', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0023_security_performance.sql','utf8');
    expect(m).toContain('audits');
  });
});
describe('PHASE-024 check 2 — MVP security review exists', () => {
  it('MVP security review exists', () => {
    expect(fs.existsSync('../../docs/security/MVP_SECURITY_REVIEW.md')).toBe(true);
  });
});