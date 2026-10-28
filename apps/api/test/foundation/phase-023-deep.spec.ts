import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-023 check 1 — integrations migration', () => {
  it('integrations migration', () => {
    const m = fs.readFileSync('../../apps/api/migrations/0022_integrations_einvoicing.sql','utf8');
    expect(m).toContain('integrations');
  });
});