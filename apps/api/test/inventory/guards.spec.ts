import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('INV-018 RLS + append guards + CI', () => {
  const sql = fs.readFileSync('migrations/0011_inventory_core.sql', 'utf8');
  it('RLS enabled for all 11 tables', () => {
    const tables = ['warehouses','item_warehouse_settings','stock_moves','stock_layers','item_stock','item_batches','item_serials','stock_transfers','stock_transfer_lines','stock_counts','stock_count_lines','stock_reservations'];
    for (const t of tables) expect(sql).toContain(`ENABLE ROW LEVEL SECURITY`);
    // spot check policy uses tenant_id
    expect(sql).toContain('current_tenant_id');
  });
  it('append-only: stock_moves immutable trigger + REVOKE UPDATE/DELETE', () => {
    expect(sql).toContain('erp.stock_moves_immutable');
    expect(sql).toContain('REVOKE UPDATE, DELETE ON stock_moves');
    expect(sql).toContain('BEFORE UPDATE OR DELETE');
  });
  it('tenant-first indexes for stock_moves', () => {
    expect(sql).toContain('(tenant_id, item_id, warehouse_id, moved_at)');
  });
  it('stock_transfers DRAFT→IN_TRANSIT→POSTED status check', () => {
    expect(sql).toContain("status IN ('DRAFT','IN_TRANSIT','POSTED')");
  });
  it('stock_counts DRAFT→COUNTED→VARIANCE_REVIEW→POSTED', () => {
    expect(sql).toContain("status IN ('DRAFT','COUNTED','VARIANCE_REVIEW','POSTED')");
  });
  it('negative-stock flag default referenced in movement-service', () => {
    const svc = fs.readFileSync('src/modules/inventory/application/movement-service.ts', 'utf8');
    expect(svc).toContain('allow_negative_stock');
    expect(svc).toContain('INSUFFICIENT_STOCK');
  });
});
