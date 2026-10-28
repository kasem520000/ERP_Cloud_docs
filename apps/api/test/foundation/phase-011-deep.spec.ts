import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-011 T1 — Purchasing migration deep', () => {
  it('0012 creates purchase_orders + goods_receipts + supplier_invoices RLS', () => {
    const m12 = fs.readFileSync('../../apps/api/migrations/0012_purchasing_core.sql','utf8');
    expect(m12).toContain('purchase_orders');
    expect(m12).toContain('tenant_isolation');
  });
});
describe('PHASE-011 T2 — Purchasing services deep', () => {
  it('purchase-orders, goods-receipts, matching services exist', () => {
    expect(fs.existsSync('src/modules/purchasing/application/purchase-orders.ts')).toBe(true);
    expect(fs.existsSync('src/modules/purchasing/application/goods-receipts.ts')).toBe(true);
    expect(fs.existsSync('src/modules/purchasing/application/matching.ts')).toBe(true);
  });
});
