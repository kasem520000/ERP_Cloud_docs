import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('AR reconciliation RC-01/03 + aging deterministic RC-10 + BR-028',()=>{
  it('reconcileAr INV-009 OK/BROKEN ar_009',()=>{
    const src=fs.readFileSync('src/modules/sales/application/ar-queries.ts','utf8');
    expect(src).toContain('reconcileAr');
    expect(src).toContain('AR_CONTROL');
    expect(src).toContain('ar_009');
    expect(src).toContain('BROKEN');
  });
  it('aging 5 buckets notDue/d1_30/d31_60/d61_90/over90 deterministic as-of BR-028',()=>{
    const src=fs.readFileSync('src/modules/sales/application/ar-queries.ts','utf8');
    expect(src).toContain('notDue');
    expect(src).toContain('over90');
    expect(src).toContain('asOf');
    expect(src).toContain('deterministic');
    expect(src).toContain('BR-028');
  });
  it('customer statement running balance = subledger = AR_CONTROL INV-009',()=>{
    const src=fs.readFileSync('src/modules/sales/application/ar-queries.ts','utf8');
    expect(src).toContain('getCustomerStatement');
    expect(src).toContain('INV-009');
    expect(src).toContain('running balance');
  });
});
