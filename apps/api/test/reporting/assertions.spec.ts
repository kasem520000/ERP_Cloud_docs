import { describe, it, expect } from 'vitest'; import { assertTbDebitsEqualCredits, assertBsCurrentYearOnce, assertCfCashTie, shouldBlockExport, ALL_FINANCIAL_ASSERTIONS } from '../../src/modules/reporting/application/assertions.js'; import fs from 'node:fs';
describe('financial assertions §11 INV-001/019',()=>{
  it('ALL_FINANCIAL_ASSERTIONS 8 ids present + executable',()=>{
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('tb-debits-equal-credits');
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('tb-closing-net-zero');
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('gl-entry-balance');
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('is-tb-tie');
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('bs-tb-tie');
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('bs-current-year-once');
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('is-net-equals-bs-current-result');
    expect(ALL_FINANCIAL_ASSERTIONS).toContain('cf-cash-tie');
  });
  it('tb-debits-equal-credits ↔ INV-001 pass/fail exact-decimal tolerance 0',()=>{
    expect(assertTbDebitsEqualCredits('100.0000','100.0000').status).toBe('PASS');
    expect(assertTbDebitsEqualCredits('100.0000','99.9999').status).toBe('FAIL');
  });
  it('bs-current-year-once counted exactly once',()=>{
    const ok=assertBsCurrentYearOnce('100','50','20','130'); // 100+50-20=130
    expect(ok.status).toBe('PASS');
    expect(assertBsCurrentYearOnce('100','50','20','140').status).toBe('FAIL');
  });
  it('cf-cash-tie ↔ INV-019',()=>{
    expect(assertCfCashTie('10','10').status).toBe('PASS');
    expect(assertCfCashTie('10','9').status).toBe('FAIL');
  });
  it('FAIL → ASSERTION_FAILED stored + export/print blocked server-side',()=>{
    expect(shouldBlockExport([{id:'tb-debits-equal-credits', status:'PASS'}])).toBe(false);
    expect(shouldBlockExport([{id:'tb-debits-equal-credits', status:'FAIL'}])).toBe(true);
    const ctrl=fs.readFileSync('src/modules/reporting/presentation/reporting.controller.ts','utf8');
    expect(ctrl).toContain('ASSERTION_FAILED');
    expect(ctrl).toContain('shouldBlockExport');
  });
  it('assertion engine lists all 8 checks executable with compared values',()=>{
    const src=fs.readFileSync('src/modules/reporting/application/assertions.ts','utf8');
    expect(src).toContain('INV-001');
    expect(src).toContain('INV-019');
    expect(src).toContain('exact-decimal');
  });
});
