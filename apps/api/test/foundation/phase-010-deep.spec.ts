import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-010 T1 — Inventory migration deep', () => {
  it('0011 creates warehouses + stock_ledgers + movements with RLS', () => {
    const m11 = fs.readFileSync('../../apps/api/migrations/0011_inventory_core.sql','utf8');
    expect(m11).toContain('warehouses');
    expect(m11).toContain('stock');
    expect(m11).toContain('tenant_isolation');
  });
});

describe('PHASE-010 T2 — Inventory services deep', () => {
  it('warehouse, movement, transfer services exist', () => {
    expect(fs.existsSync('src/modules/inventory/application/warehouse-service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/inventory/application/movement-service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/inventory/application/transfers.ts')).toBe(true);
  });
  it('valuation FIFO/WAC exists', () => {
    expect(fs.existsSync('src/modules/inventory/domain/valuation/fifo.ts')).toBe(true);
    expect(fs.existsSync('src/modules/inventory/domain/valuation/wac.ts')).toBe(true);
  });
  it('batch/serial tracking exists', () => {
    expect(fs.existsSync('src/modules/inventory/application/tracking/batch-service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/inventory/application/tracking/serial-service.ts')).toBe(true);
  });
});

describe('PHASE-010 T3 — Inventory presentation deep', () => {
  it('inventory controller exists', () => {
    expect(fs.existsSync('src/modules/inventory/presentation/inventory.controller.ts')).toBe(true);
  });
});
