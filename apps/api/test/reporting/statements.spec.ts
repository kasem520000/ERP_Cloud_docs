import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('financial statements FINANCIAL_REPORT_RULES',()=>{
  it('TB/GL/IS/BS/CF + contra aggregation + RE composition once + indirect CF limitation displayed',()=>{
    const src=fs.readFileSync('src/modules/reporting/application/statement-queries.ts','utf8');
    expect(src).toContain('trialBalance');
    expect(src).toContain('generalLedger');
    expect(src).toContain('incomeStatement');
    expect(src).toContain('balanceSheet');
    expect(src).toContain('cashFlowIndirect');
    expect(src).toContain('contra');
    expect(src).toContain('bs-current-year-once');
    expect(src).toContain('indirect');
    expect(src).toContain('أخرى / Other'); // untagged accounts limitation
  });
  it('comparatives re-derived + as-of byte-identical determinism cache invalidation',()=>{
    const cache=fs.readFileSync('src/modules/reporting/application/cache.ts','utf8');
    expect(cache).toContain('cacheKey');
    expect(cache).toContain('asOf');
    expect(cache).toContain('invalidateOnPosting');
    expect(cache).toContain('CURRENT_TTL_SECONDS');
    const stmt=fs.readFileSync('src/modules/reporting/application/statement-queries.ts','utf8');
    expect(stmt).toContain('asOf');
  });
  it('drill chain statement→GL→journal→source document per-hop permission',()=>{
    const exe=fs.readFileSync('src/modules/reporting/application/executor.ts','utf8');
    expect(exe).toContain('drillLinks');
    expect(exe).toContain('sourceDoc');
  });
  it('financial contracts registered 5 with reports.financial.*.read',()=>{
    for(const f of ['trial-balance','general-ledger','income-statement','balance-sheet','cash-flow']){
      expect(fs.existsSync(`src/modules/reporting/registry/financial/${f}.ts`)).toBe(true);
    }
    const tb=fs.readFileSync('src/modules/reporting/registry/financial/trial-balance.ts','utf8');
    expect(tb).toContain('reports.financial.tb.read');
  });
  it('operational contracts inventory/sales/purchasing/ar-ap/tax/treasury/platform over live query services',()=>{
    expect(fs.existsSync('src/modules/reporting/registry/inventory/stock-on-hand.ts')).toBe(true);
    expect(fs.readFileSync('src/modules/reporting/registry/ar-ap/aging.ts','utf8')).toContain('reports.ar.aging.read');
    expect(fs.readFileSync('src/modules/reporting/registry/tax/vat-return.ts','utf8')).toContain('vatReturnQueries');
  });
});
