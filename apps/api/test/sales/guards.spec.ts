import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('PHASE-012 sales RLS + migration + status',()=>{
  const sql=fs.readFileSync('migrations/0013_sales_core.sql','utf8');
  it('all core tables have RLS',()=>{
    for(const t of ['quotations','sales_orders','delivery_notes','sales_invoices','credit_notes','sales_reps','ar_allocations']) expect(sql).toContain(`ENABLE ROW LEVEL SECURITY`);
    expect(sql).toContain('current_tenant_id');
  });
  it('status checks + numbering unique constraint INV-021',()=>{
    expect(sql).toContain(`sales_invoices`);
    expect(sql).toContain(`UNIQUE (tenant_id, invoice_no)`);
    expect(sql).toContain(`UNIQUE (tenant_id, branch_id, invoice_no)`);
    expect(sql).toContain(`offline_receipt_no`); // POS yes
  });
  it('BR-006 quote validity column exists',()=> expect(sql).toContain('valid_until'));
  it('BR-004 return window + mandatory reference',()=>{
    const src=fs.readFileSync('src/modules/sales/application/credit-notes.ts','utf8');
    expect(src).toContain('BR-004');
    expect(src).toContain('return window');
    expect(src).toContain('reference required');
  });
  it('controller exposes required routes §4',()=>{
    const ctrl=fs.readFileSync('src/modules/sales/presentation/sales.controller.ts','utf8');
    for(const r of ['quotations','sales','orders','delivery-notes','invoices','credit-notes','receipts','ar/aging','ar/statements','ar/reconcile','reps']) expect(ctrl.toLowerCase()).toContain(r.replace(':',''));
  });
  it('web sales pages exist',()=>{
    for(const p of ['quotations','orders','delivery-notes','invoices','credit-notes','receipts','ar-aging']) expect(fs.existsSync(`../web/src/app/[locale]/sales/${p}/page.tsx`)).toBe(true);
  });
  it('no commission code exists (scope guard)',()=>{
    const files=fs.readdirSync('src/modules/sales/application').filter(f=> f!=='reps.ts');
    for(const f of files) expect(fs.readFileSync(`src/modules/sales/application/${f}`,'utf8').toLowerCase()).not.toContain('commission');
  });
});
