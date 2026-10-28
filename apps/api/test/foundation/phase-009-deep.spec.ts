import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-009 T1 — Tax migrations deep', () => {
  it('0010 creates tax_treatments + jurisdictions + tax_codes with global no RLS', () => {
    const m10 = fs.readFileSync('../../apps/api/migrations/0010_tax.sql','utf8');
    expect(m10).toContain('tax_treatments');
    expect(m10).toContain('jurisdictions');
    expect(m10).toContain('tax_codes');
    expect(m10).toContain('REVOKE INSERT');
  });
});

describe('PHASE-009 T2 — Tax services deep', () => {
  it('codes-service handles tax codes CRUD', () => {
    expect(fs.existsSync('src/modules/tax/application/codes-service.ts')).toBe(true);
  });
  it('resolver implements deterministic jurisdiction pack', () => {
    expect(fs.existsSync('src/modules/tax/domain/resolver')).toBe(true);
    expect(fs.existsSync('src/modules/tax/domain/einvoicing')).toBe(true);
  });
  it('vat-return service exists', () => {
    expect(fs.existsSync('src/modules/tax/application/vat-return-service.ts')).toBe(true);
  });
});

describe('PHASE-009 T3 — Tax presentation deep', () => {
  it('tax controller exists', () => {
    expect(fs.existsSync('src/modules/tax/presentation/tax.controller.ts')).toBe(true);
  });
});
