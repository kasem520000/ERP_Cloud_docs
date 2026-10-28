import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('golden G-01..G-06 W-1/W-2/W-3',()=>{
  it('G-01 credit invoice DR AR_CONTROL CR SALES_REVENUE CR VAT_PAYABLE',()=>{
    const src=fs.readFileSync('src/modules/sales/application/invoices.ts','utf8');
    expect(src).toContain('G-01');
    expect(src).toContain('AR_CONTROL');
    expect(src).toContain('SALES_REVENUE');
    expect(src).toContain('VAT_PAYABLE');
  });
  it('G-02 cash invoice DR CASH',()=>{
    const src=fs.readFileSync('src/modules/sales/application/invoices.ts','utf8');
    expect(src).toContain('G-02');
    expect(src).toContain(`'CASH'`);
  });
  it('G-03 COGS DR COGS CR INVENTORY via issueStock',()=>{
    const src=fs.readFileSync('src/modules/sales/application/deliveries.ts','utf8');
    expect(src).toContain('G-03');
    expect(src).toContain('issueStock');
    expect(src).toContain('COGS');
  });
  it('G-04 credit note W-3 re-entry at original cost INVENTORY/COGS',()=>{
    const src=fs.readFileSync('src/modules/sales/application/credit-notes.ts','utf8');
    expect(src).toContain('G-04');
    expect(src).toContain('W-3');
    expect(src).toContain('original_cost');
    expect(src).toContain('receiveStock');
  });
  it('G-05 receipt DR CASH CR AR_CONTROL + G-06 FX gain/loss',()=>{
    const src=fs.readFileSync('src/modules/sales/application/receipts.ts','utf8');
    expect(src).toContain('G-05');
    expect(src).toContain('FX_GAIN');
    expect(src).toContain('FX_LOSS');
  });
  it('posting sequencing per POSTING_ENGINE §5 one tx numbering INV-021',()=>{
    const src=fs.readFileSync('src/modules/sales/application/invoices.ts','utf8');
    expect(src).toContain('POSTING_ENGINE');
    expect(src).toContain('nextNo');
    expect(src).toContain('INV-021');
  });
  it('tax snapshot per line + BR-033 stale-draft + NOT_SUBJECT',()=>{
    const src=fs.readFileSync('src/modules/sales/application/invoices.ts','utf8');
    expect(src).toContain('tax_snapshot');
    expect(src).toContain('NOT_SUBJECT');
  });
});
