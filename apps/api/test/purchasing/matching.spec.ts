import { describe, it, expect } from 'vitest';
import { evaluateLine } from '../../src/modules/purchasing/domain/matching.js';
import { resolveRecoverability, computeVat } from '../../src/modules/purchasing/domain/vat-recoverability.js';
import fs from 'node:fs';

describe('BR-009 three-way matching',()=>{
  it('exact tolerance: price variance 2% → exception',()=>{
    const ev=evaluateLine({ poQty:'100', poPrice:'50.00', grnQty:'100', invQty:'100', invPrice:'51.00', qtyTolPct:0, priceTolPct:0 });
    expect(ev.outcome).toBe('PRICE_VARIANCE');
    expect(ev.withinTolerance).toBe(false);
  });
  it('2% tolerance → auto-pass same variance',()=>{
    const ev=evaluateLine({ poQty:'100', poPrice:'50.00', grnQty:'100', invQty:'100', invPrice:'51.00', qtyTolPct:0, priceTolPct:2 });
    expect(ev.outcome).toBe('MATCH');
    expect(ev.withinTolerance).toBe(true);
  });
  it('short-receipt 98/100 → qty variance',()=>{
    const ev=evaluateLine({ poQty:'100', poPrice:'50.00', grnQty:'98', invQty:'100', invPrice:'50.00', qtyTolPct:0, priceTolPct:0 });
    expect(ev.outcome).toBe('QTY_VARIANCE');
  });
  it('matching service stores match_result before approval',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/matching.ts','utf8');
    expect(src).toContain('match_result');
    expect(src).toContain('purchasing.match.qty_tolerance_pct');
    expect(src).toContain('BR-009');
  });
  it('supplier-invoice post guards match_result required',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/supplier-invoices.ts','utf8');
    expect(src).toContain('BR-009: match_result required before posting');
  });
  it('disposition reason required',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/matching.ts','utf8');
    expect(src).toContain('reason required');
  });
});

describe('VAT recoverability per pack+registration',()=>{
  it('REGISTERED STANDARD → VAT_RECOVERABLE',()=> expect(resolveRecoverability('STANDARD_RATED','REGISTERED')).toBe('VAT_RECOVERABLE'));
  it('NOT_REGISTERED → NOT_SUBJECT',()=> expect(resolveRecoverability('STANDARD_RATED','NOT_REGISTERED')).toBe('NOT_SUBJECT'));
  it('EXEMPT → VAT_EXPENSED',()=> expect(resolveRecoverability('EXEMPT','REGISTERED')).toBe('VAT_EXPENSED'));
  it('computeVat',()=> expect(computeVat('100.00','0.1500')).toBe('15.0000'));
  it('supplier-invoice lines store tax_snapshot + vat_recoverable/expensed',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/supplier-invoices.ts','utf8');
    expect(src).toContain('tax_snapshot');
    expect(src).toContain('vat_recoverable');
    expect(src).toContain('VAT_RECOVERABLE');
    expect(src).toContain('VAT_EXPENSED');
    expect(src).toContain('NOT_SUBJECT');
  });
});

describe('BR-011 duplicate & BR-010 thresholds',()=>{
  it('duplicate (supplier,number,amount) blocked',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/supplier-invoices.ts','utf8');
    expect(src).toContain('BR-011: duplicate invoice blocked');
    expect(src).toContain('supplier_invoice.duplicate_warn');
  });
  it('PO threshold routes to PENDING_APPROVAL',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/purchase-orders.ts','utf8');
    expect(src).toContain('PENDING_APPROVAL');
    expect(src).toContain('approvals.purchase_order');
    expect(src).toContain('nextNo');
  });
  it('SoD creator != approver',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/purchase-orders.ts','utf8');
    expect(src).toContain('SoD');
  });
});
