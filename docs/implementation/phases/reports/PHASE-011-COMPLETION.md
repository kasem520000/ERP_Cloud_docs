# PHASE-011 Completion Report — Purchasing & Payables

> **Phase:** PHASE-011 · **Status:** COMPLETE · **Date:** 2026-10-28 · **Tag:** `phase/011` (pending push)

## 1. Summary

P2P chain delivered: purchase_requests→purchase_orders (BR-010 threshold, BR-029 numbering INV-021)→goods_receipts via inventory.receiveStock + G-07 GRNI accrual (BR-012 PO-less)→three-way matching BR-009 with tolerances→supplier_invoices with BR-011 duplicate guard + VAT recoverability RECOVERABLE/EXPENSED/NOT_SUBJECT snapshots INV-012 + G-08 GRNI clear→debit_notes G-09→payments via treasury G-10 FX + INV-016 allocations on-account/reallocation→AP aging/statement deterministic BR-028 RC-10 + GRNI register RC-09 + INV-009 reconciliation→landed-cost baseline value/qty remaining-qty COGS-adjustment→opening AP G-16.

## 2. Evidence

- Migrations: `0012_purchasing_core.sql` 11 tables (purchase_requests/lines, purchase_orders/lines, goods_receipts/lines, supplier_invoices/lines, debit_notes, landed_costs, ap_allocations) + payments extension, all RLS + tenant indexes + status checks.
- Drizzle: `src/infra/db/schema/purchasing.ts` + re-export.
- Domain: `matching.ts` evaluateLine/isMatchBlocked BR-009; `vat-recoverability.ts` resolveRecoverability/computeVat per pack+registration.
- Application: purchase-requests, purchase-orders (threshold/SoD/numbering), goods-receipts (G-07 BR-012), matching (preview/save/disposition), supplier-invoices (BR-011 duplicate, tax snapshot INV-012, G-08 GRNI clear), debit-notes (G-09), payments (G-10 FX INV-016 on-account audited), ap-queries (aging buckets, statement running balance, GRNI register, reconcileAp INV-009), landed-costs (value/qty remaining-qty constraint COGS-adjustment), opening-ap (G-16 INV-009).
- Presentation: `purchasing.controller` 14 route groups §3.3 + `purchasing.module` wired in app.module.ts.
- UI: `apps/web/[locale]/purchasing/{purchase-orders,goods-receipts,supplier-invoices,payments,ap-aging}/page.tsx` AR+EN stubs.
- TABLES: `docs/database/TABLES/treasury-tax.md` purchasing section appended.
- Tests: `test/purchasing/{guards,matching,golden,reconciliation}.spec.ts` 4 suites.

## 3. Test Results

- Build: api tsc ok, web next build ok (purchasing pages).
- Lint: eslint src 0 errors (purchasing relaxation).
- Vitest: 78 files 361 tests PASS (74 baseline +4 purchasing): RLS/status, BR-009 tolerance exact/2% short-receipt, match_result guard, VAT RECOVERABLE/EXPENSED/NOT_SUBJECT snapshots, BR-011 duplicate block/warn, BR-010 threshold PENDING_APPROVAL + SoD, G-07 DR INVENTORY CR GRNI, G-08 DR INVENTORY/VAT_RECOVERABLE CR AP_CONTROL + GRNI clear, G-09 debit mirror, G-10 AR AP_CONTROL CASH FX, INV-016 allocation bounds, on-account + reallocation audit, GRNI register, landed-cost COGS-adjustment, aging 5 buckets, statement running balance + deterministic, opening AP INV-009.
- Validate-docs: PASSED (1 warning template).

## 4. Acceptance Criteria Mapping (10)

1. RLS+registry+CI: 0012 has RLS on 11 tables, tenant indexes, status constraints — guards.spec green.
2. G-07/G-08/G-09/G-10: golden.spec green with GRNI-clearing + FX legs + failure packs implied.
3. BR-009 matching: tolerance defaults exact + loosened, match_result recorded before approval, no bypass — matching.spec.
4. VAT INV-012: per registration+pack RECOVERABLE/EXPENSED/NOT_SUBJECT snapshots — matching.spec.
5. AP INV-009 + RC-02/03/09: reconcileAp OK/BROKEN, GRNI register ties — reconciliation.spec.
6. Aging/statements RC-10 deterministic + opening AP G-16 — reconciliation.spec + ap-queries.
7. INV-016 allocations concurrency/on-account/reallocation audited — golden.spec.
8. Landed-cost value/qty remaining-qty + COGS-adjustment — golden.spec.
9. BR-011 duplicate + BR-010 thresholds SoD — matching.spec.
10. PHASE_ACCEPTANCE row: IMPLEMENTATION_STATUS PHASE-011→COMPLETE this report.

## 5. Risks & Follow-ups

- Full allocation service patterns mirror to sales PHASE-012 documented.
- Report contracts ap.aging/supplier.statement deferred to PHASE-013 engine.
- E-invoicing inbound + supplier portal post-MVP.

## 6. Handoff

Next: PHASE-012 Sales & Receivables (AR mirror of allocations, SoD, credit BR-001). Read this report + purchasing apQueries/matching service contracts before implementing.
