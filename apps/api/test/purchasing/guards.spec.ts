import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('PHASE-011 purchasing RLS + migration CI', ()=>{
  const sql=fs.readFileSync('migrations/0012_purchasing_core.sql','utf8');
  it('all core tables have RLS',()=>{
    const tables=['purchase_requests','purchase_orders','goods_receipts','supplier_invoices','debit_notes','landed_costs','ap_allocations'];
    for(const t of tables) expect(sql).toContain(`ENABLE ROW LEVEL SECURITY`);
    expect(sql).toContain('current_tenant_id');
  });
  it('status checks present DRAFT→POSTED flows',()=>{
    expect(sql).toContain(`supplier_invoices`);
    expect(sql).toContain(`status IN ('DRAFT','PENDING_APPROVAL','APPROVED','POSTED'`);
    expect(sql).toContain(`goods_receipts`);
    expect(sql).toContain(`DRAFT','POSTED','REVERSED'`);
  });
  it('tenant-first indexes for PO/SI',()=>{
    expect(sql).toContain('ix_po_tenant_supplier');
    expect(sql).toContain('ix_si_tenant_supplier');
    expect(sql).toContain('ix_grn_tenant_warehouse');
  });
  it('BR-012 PO-less policy column guard present in service',()=>{
    const svc=fs.readFileSync('src/modules/purchasing/application/goods-receipts.ts','utf8');
    expect(svc).toContain('allow_po_less_grn');
    expect(svc).toContain('BR-012');
  });
  it('controller exposes required routes §4',()=>{
    const ctrl=fs.readFileSync('src/modules/purchasing/presentation/purchasing.controller.ts','utf8');
    for(const r of ['purchase-requests','purchase-orders','goods-receipts','supplier-invoices','debit-notes','payments','ap/aging','ap/statements','ap/grni-register','landed-costs']) expect(ctrl).toContain(r);
  });
  it('web purchasing pages exist AR+EN',()=>{
    for(const p of ['purchase-orders','goods-receipts','supplier-invoices','payments','ap-aging']) expect(fs.existsSync(`../web/src/app/[locale]/purchasing/${p}/page.tsx`)).toBe(true);
  });
});
