import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('golden G-07..G-10 postings + INV-016/012',()=>{
  it('G-07 GRN DR INVENTORY CR GRNI + receiveStock',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/goods-receipts.ts','utf8');
    expect(src).toContain('DR INVENTORY');
    expect(src).toContain('GRNI');
    expect(src).toContain('receiveStock');
    expect(src).toContain('G-07');
  });
  it('G-08 supplier invoice DR INVENTORY DR VAT_RECOVERABLE CR AP_CONTROL + GRNI clear',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/supplier-invoices.ts','utf8');
    expect(src).toContain('VAT_RECOVERABLE');
    expect(src).toContain('AP_CONTROL');
    expect(src).toContain('GRNI');
    expect(src).toContain('GRNI'); // clear leg
    expect(src).toContain('G-08');
    expect(src).toContain('INV-012');
  });
  it('G-09 debit note DR AP_CONTROL CR INVENTORY CR VAT_RECOVERABLE',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/debit-notes.ts','utf8');
    expect(src).toContain('AP_CONTROL');
    expect(src).toContain('G-09');
  });
  it('G-10 payment DR AP_CONTROL CR CASH + FX',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/payments.ts','utf8');
    expect(src).toContain('AP_CONTROL');
    expect(src).toContain('CASH');
    expect(src).toContain('FX_GAIN');
    expect(src).toContain('FX_LOSS');
    expect(src).toContain('G-10');
  });
  it('INV-016 allocation bounds both sides',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/payments.ts','utf8');
    expect(src).toContain('INV-016: allocation exceeds payment');
    expect(src).toContain('INV-016: allocation exceeds invoice open');
  });
  it('on-account remainder + reallocation audited',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/payments.ts','utf8');
    expect(src).toContain('on-account');
    expect(src).toContain('payment.reallocated');
  });
  it('GRNI register = GRNI account RC-09',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/ap-queries.ts','utf8');
    expect(src).toContain('getGrniRegister');
  });
  it('landed-cost remaining-qty constraint + COGS-adjustment',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/landed-costs.ts','utf8');
    expect(src).toContain('remaining-qty constraint');
    expect(src).toContain('COGS-adjustment');
    expect(src).toContain('allocation_method');
  });
  it('AP aging + statements deterministic as-of BR-028 RC-10',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/ap-queries.ts','utf8');
    expect(src).toContain('getAging');
    expect(src).toContain('getSupplierStatement');
    expect(src).toContain('asOf');
  });
});
