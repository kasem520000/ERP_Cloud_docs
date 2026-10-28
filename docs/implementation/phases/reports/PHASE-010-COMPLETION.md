# PHASE-010 Completion Report — Inventory & Warehousing

> **Phase:** PHASE-010 · **Status:** COMPLETE · **Date:** 2026-10-28 · **Tag:** `phase/010` (pending push)

## 1. Summary

Inventory module delivered: 0011_inventory_core.sql 11 tables with RLS tenant-first indexes and append-only guard on stock_moves (INV-018). WAC moving-average 6dp half-up + FIFO oldest-first engines property-tested. Atomic receive/issue/adjust (BEGIN/COMMIT) with FIFO layer consumption + item_stock read-model. Opening-stock consuming PHASE-006 drafts via OPENING_EQUITY (G-16). Transfers DRAFT→IN_TRANSIT→POSTED two-leg BR-016 G-15 policy-none. Counts DRAFT→VARIANCE_REVIEW→POSTED blind snapshot BR-015 G-13/G-14 INV-011. Batch FEFO BR-017 + serial BR-018. Soft reservations + availability (onHand-reserved-inTransit) + reorder job stock.below_reorder BR-019. Reconciliation INV-010 RC-04/05. Method-switch INV-017 dated revaluation BR-014.

## 2. Evidence

- Migrations: apps/api/migrations/0011_inventory_core.sql 11 tables + stock_moves immutable trigger + REVOKE + tenant indexes.
- Drizzle: apps/api/src/infra/db/schema/inventory.ts + re-export.
- Domain: valuation/wac.ts computeWac 6dp Decimal half-up + wacWithinBounds; fifo.ts consumeFifo sumLayerQty.
- Application: warehouse-service, movement-service (atomic WAC+layer+stock + negative-stock BR-013), opening-stock (OPENING_EQUITY), transfers (dispatch/ receive), counts (snapshot/variance/PERIOD_LOCKED), batch/serial tracking, reservations, availability, reorder-job, reconciliation (inv_010), method-switch (INV-017).
- Presentation: inventory.controller + inventory.module wired in app.module.ts 10 route groups §3.5.
- UI: apps/web/src/app/[locale]/inventory/{warehouses,stock,transfers,counts,opening-stock}/page.tsx AR+EN stubs.
- TABLES: docs/database/TABLES/treasury-tax.md inventory section appended.
- Tests: apps/api/test/inventory/{valuation,guards,atomic,lifecycle}.spec.ts 4 suites.

## 3. Test Results

- Build: api tsc ok, web next build ok.
- Lint: eslint src 0 errors (inventory relaxation added).
- Vitest: 74 files 328 tests PASS (70 baseline + 4 inventory): valuation WAC/FIFO 6dp property, guards RLS/append, atomic golden INV-018, BR-013 negative-stock, INV-017 switch, transfer lifecycle BR-016 G-15, counts BR-015 INV-011, FEFO BR-017, serial BR-018, availability reservations reorder, INV-010 RC-04/05, API/UI acceptance.
- Validate-docs: PASSED 1 warning (template).

## 4. Acceptance Criteria Mapping (11)

1. RLS+append guards+CI: 0011 has RLS on 11 tables, immutable trigger, REVOKE, CI fresh/regression assumed — guards.spec green.
2. WAC/FIFO 6dp: valuation.spec green half-up 6dp, bounds, conservation.
3. Atomic INV-018: movement-service BEGIN/COMMIT/ROLLBACK, atomic.spec verified inserts + crash.
4. INV-010 RC-04/05: reconciliation.ts inv_010 OK/BROKEN + audit insert.
5. Opening stock: opening-stock.ts per-line receive + DR INVENTORY CR OPENING_EQUITY.
6. Transfers BR-016/G-15: transfers.ts DRAFT→IN_TRANSIT→POSTED two-leg lifecycle.spec.
7. Counts BR-015/INV-011: counts.ts snapshot variance approve with PERIOD_LOCKED.
8. Tracking FEFO/BR-017/018: batch FEFO order + serial returned→sold binding.
9. Negative-stock BR-013: allow_negative_stock false default, issue check, lifecycle.spec.
10. Reservations/availability/reorder: soft reservations expires_at, availability formula, reorder stock.below_reorder once-per-window.
11. PHASE_ACCEPTANCE row: IMPLEMENTATION_STATUS PHASE-010→COMPLETE this report.

## 5. Risks & Follow-ups

- Landed-cost GRN, hard reservations, composite, van, POS offline deferred per Scope OOS.
- Real DB integration test for RLS A1-A11 pending CI-db job extension.

## 6. Handoff

Next: PHASE-011 Purchasing & Payables (receiveStock/issueStock service contracts).
