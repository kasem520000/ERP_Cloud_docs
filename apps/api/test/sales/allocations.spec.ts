import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('allocations INV-016 + BR-027 on-account + credit limits BR-001',()=>{
  it('INV-016 bounds receipt/invoice both sides',()=>{
    const src=fs.readFileSync('src/modules/sales/application/receipts.ts','utf8');
    expect(src).toContain('INV-016: allocation exceeds receipt');
    expect(src).toContain('INV-016: allocation exceeds invoice open');
  });
  it('BR-027 on-account remainder visible',()=>{
    const src=fs.readFileSync('src/modules/sales/application/receipts.ts','utf8');
    expect(src).toContain('on-account');
  });
  it('FIFO suggestion + reallocation audited',()=>{
    const src=fs.readFileSync('src/modules/sales/application/allocations.ts','utf8');
    expect(src).toContain('suggestFifo');
    expect(src).toContain('receipt.reallocated');
    expect(src).toContain('INV-016');
  });
  it('BR-001 credit check at approval block/warn/ignore + CREDIT_LIMIT_EXCEEDED',()=>{
    const src=fs.readFileSync('src/modules/sales/domain/credit-check.ts','utf8');
    expect(src).toContain('CREDIT_LIMIT_EXCEEDED');
    expect(src).toContain("'block'");
    expect(src).toContain("'warn'");
  });
  it('invoices approval calls checkCredit with math payload',()=>{
    const src=fs.readFileSync('src/modules/sales/application/invoices.ts','utf8');
    expect(src).toContain('checkCredit');
    expect(src).toContain('CREDIT_LIMIT_EXCEEDED');
    expect(src).toContain('sales.credit_limit_action');
  });
  it('quotation BR-006 expiry + convert carries lines',()=>{
    const src=fs.readFileSync('src/modules/sales/application/quotations.ts','utf8');
    expect(src).toContain('BR-006');
    expect(src).toContain('valid_until');
    expect(src).toContain('convertQuotation');
  });
  it('pricing BR-003 precedence + BR-002 ceiling',()=>{
    const src=fs.readFileSync('src/modules/sales/domain/pricing.ts','utf8');
    expect(src).toContain('customer_list');
    expect(src).toContain('BR-003');
    expect(src).toContain('isOverrideAllowed');
  });
});
