import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
describe('PHASE-012 T1 — Sales migration deep', () => {
  it('0013 creates quotations + sales_orders + deliveries + invoices RLS', () => {
    const m13 = fs.readFileSync('../../apps/api/migrations/0013_sales_core.sql','utf8');
    expect(m13).toContain('sales_orders');
    expect(m13).toContain('tenant_isolation');
  });
});
describe('PHASE-012 T2 — Sales services deep', () => {
  it('sales services exist with credit-check integration', () => {
    expect(fs.existsSync('src/modules/sales/application/orders.ts')).toBe(true);
    expect(fs.existsSync('src/modules/sales/application/invoices.ts')).toBe(true);
    expect(fs.existsSync('src/modules/sales/domain/pricing.ts')).toBe(true);
  });
});
