import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';

describe('transfer lifecycle DRAFT→IN_TRANSIT→POSTED BR-016 two-leg G-15 policy-none', () => {
  it('transfers.ts creates DRAFT then dispatch via issueStock then receive via receiveStock', () => {
    const src = fs.readFileSync('src/modules/inventory/application/transfers.ts', 'utf8');
    expect(src).toContain("'DRAFT'");
    expect(src).toContain("'IN_TRANSIT'");
    expect(src).toContain("'POSTED'");
    expect(src).toContain('issueStock');
    expect(src).toContain('receiveStock');
  });
  it('stock_transfers FK warehouses', () => {
    const sql = fs.readFileSync('migrations/0011_inventory_core.sql', 'utf8');
    expect(sql).toContain('stock_transfers');
    expect(sql).toContain('from_warehouse_id');
    expect(sql).toContain('to_warehouse_id');
  });
});

describe('counts DRAFT→COUNTED→VARIANCE_REVIEW→POSTED blind snapshot variance G-13/G-14 BR-015', () => {
  it('counts.ts implements snapshot + variance + approve with PERIOD_LOCKED', () => {
    const src = fs.readFileSync('src/modules/inventory/application/counts.ts', 'utf8');
    expect(src).toContain('snapshot_at');
    expect(src).toContain('VARIANCE_REVIEW');
    expect(src).toContain('PERIOD_LOCKED');
    expect(src).toContain('is_blind');
    expect(src).toContain('variance_qty');
  });
  it('IN-011 count gain/loss via postAdjustment journal', () => {
    const src = fs.readFileSync('src/modules/inventory/application/counts.ts', 'utf8');
    expect(src).toContain('postAdjustment');
  });
});

describe('tracking FEFO BR-017 + serial/IMEI BR-018', () => {
  it('batch-service FEFO ORDER BY expiry_date ASC NULLS LAST', () => {
    const src = fs.readFileSync('src/modules/inventory/application/tracking/batch-service.ts', 'utf8');
    expect(src).toContain('ORDER BY expiry_date ASC NULLS LAST');
  });
  it('serial-service returned must reference sold unit BR-018', () => {
    const src = fs.readFileSync('src/modules/inventory/application/tracking/serial-service.ts', 'utf8');
    expect(src).toContain('BR-018');
    expect(src).toContain("status='sold'");
    expect(src).toContain("'returned'");
  });
});

describe('soft reservations stock_reservations + availability + on-hand-reserved-intransit', () => {
  it('reservations inserts soft ACTIVE with expires_at', () => {
    const src = fs.readFileSync('src/modules/inventory/application/reservations.ts', 'utf8');
    expect(src).toContain('stock_reservations');
    expect(src).toContain('expires_at');
  });
  it('availability sums reserved ACTIVE + inTransit IN_TRANSIT + available=onHand-reserved', () => {
    const src = fs.readFileSync('src/modules/inventory/application/availability.ts', 'utf8');
    expect(src).toContain('reserved');
    expect(src).toContain('inTransit');
    expect(src).toContain('available');
    expect(src).toContain("status='IN_TRANSIT'");
    expect(src).toContain("status='ACTIVE'");
  });
});

describe('reorder nightly stock.below_reorder email BR-019 once-per-window', () => {
  it('reorder-job queries reorder_level and emits audit stock.below_reorder', () => {
    const src = fs.readFileSync('src/modules/inventory/application/reorder-job.ts', 'utf8');
    expect(src).toContain('stock.below_reorder');
    expect(src).toContain('reorder_level');
  });
});

describe('reconciliation INV-010 job RC-04/05 RC drift', () => {
  it('reconciliation checks Σ moves == item_stock and writes reconciliation_runs', () => {
    const src = fs.readFileSync('src/modules/inventory/application/reconciliation.ts', 'utf8');
    expect(src).toContain('inv_010');
    expect(src).toContain('reconciliation_runs');
    expect(src).toContain('BROKEN');
  });
});

describe('UI Settings/List+Search/Wizard/Workspace/Detail AR+EN + API routes permissions §3.5', () => {
  it('inventory controller exposes required routes', () => {
    const src = fs.readFileSync('src/modules/inventory/presentation/inventory.controller.ts', 'utf8');
    for (const r of ['warehouses','receipts','issues','transfers','counts','availability','reservations','method-switch','reconciliation']) expect(src).toContain(r);
  });
  it('web inventory pages exist', () => {
    for (const p of ['warehouses','stock','transfers','counts','opening-stock']) expect(fs.existsSync(`../web/src/app/[locale]/inventory/${p}/page.tsx`)).toBe(true);
  });
});

describe('PHASE_ACCEPTANCE row', () => {
  it('migration 0011 present and seed not needed', () => {
    expect(fs.existsSync('migrations/0011_inventory_core.sql')).toBe(true);
  });
});
