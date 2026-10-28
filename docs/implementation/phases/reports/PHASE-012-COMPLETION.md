# PHASE-012 Completion Report — Sales & Receivables

> **Phase:** PHASE-012 · **Status:** COMPLETE · **Date:** 2026-10-28 · **Tag:** `phase/012` (pending push)

## 1. Summary

Quote-to-cash chain delivered: quotations SENT/ACCEPTED/REJECTED/EXPIRED BR-006 → sales orders with soft reservations → delivery notes G-03 COGS via issueStock → sales invoices G-01/G-02/G-03 sequenced §5 with BR-003 pricing + snapshots BR-033 NOT_SUBJECT + numbering INV-021 → credit notes G-04 W-3 re-entry at original cost BR-004 → receipts via treasury G-05/G-06 FX + allocations INV-016 BR-027 → credit limits BR-001 at approval → AR aging/statements deterministic BR-028 RC-10 INV-009 → reps attribution no commissions.

## 2. Evidence

- Migrations: `0013_sales_core.sql` 11 tables (quotations/lines, sales_orders/lines, delivery_notes/lines, sales_invoices/lines, credit_notes/lines, sales_reps, ar_allocations) RLS + tenant indexes + INV-021 unique + offline_receipt_no.
- Drizzle: `src/infra/db/schema/sales.ts` + re-export.
- Domain: pricing.ts BR-003 precedence + BR-002 ceiling; credit-check.ts BR-001 block/warn/ignore.
- Application: quotations (BR-006 validity convert), orders (soft reservation), deliveries (G-03 + convert), invoices (G-01/G-02/G-03 sequencing nextNo INV-021 tax snapshots BR-033), credit-notes (BR-004 window reference G-04 re-entry), receipts (G-05/G-06 FX INV-016), allocations (FIFO suggestion reallocation audit), ar-queries (aging 5 buckets BR-028 deterministic, statement running balance INV-009, reconcileAr ar_009), reps (attribution only).
- Presentation: sales.controller 15 route groups §3.2 + sales.module wired.
- UI: `apps/web/[locale]/sales/{quotations,orders,delivery-notes,invoices,credit-notes,receipts,ar-aging}/page.tsx` AR+EN stubs.
- TABLES: treasury-tax.md sales section appended.
- Tests: test/sales/{guards,golden,allocations,reconciliation}.spec.ts 4 suites.

## 3. Test Results

- Build: api tsc ok, web next build ok.
- Lint: eslint src 0 errors.
- Vitest: 82 files 385 tests PASS (78+4 sales): RLS/INV-021/offline, BR-006/004, G-01 AR_CONTROL SALES_REVENUE VAT_PAYABLE, G-02 CASH, G-03 COGS via issueStock, G-04 W-3 original_cost receiveStock, G-05/G-06 FX, sequencing nextNo, tax_snapshot NOT_SUBJECT, INV-016 bounds both sides, BR-027 on-account, FIFO reallocation audit, BR-001 block/warn/ignore CREDIT_LIMIT_EXCEEDED, BR-003 pricing precedence, RC-01/03 INV-009, aging deterministic BR-028 RC-10, commission scope guard.
- Validate-docs: PASSED 1 warning template.

## 4. Acceptance Criteria (10)

1. Sales tables RLS + INV-021 race proven — guards.spec.
2. G-01..G-06 + W-1/W-2/W-3 + failure packs zero residue sequencing §5 — golden.spec.
3. Tax snapshots per line drafting/posting BR-033 NOT_SUBJECT — golden.spec.
4. Credit limits BR-001 server-side block/warn/ignore audited — allocations.spec.
5. Credit notes BR-004 window+reference re-entry batch/serial — guards+golden.
6. Receipts treasury FX G-06 INV-016 on-account BR-027 — golden+allocations.
7. AR aging/statements RC-10 deterministic INV-009 RC-01/03 — reconciliation.spec.
8. INV-013 idempotency CC-01 sequential+concurrent — via post idempotency in invoices post + nextNo.
9. Rep attribution present, no commission computation — reps.ts + scope guard.
10. Acceptance rows mirrored — IMPLEMENTATION_STATUS updated.

## 5. Risks & Follow-ups

- POS offline numbers + e-invoicing ingestion deferred (PHASE-016/023).
- Commissions/tier/free-goods deferred PHASE-017; prints deferred PHASE-013.

## 6. Handoff

Next: PHASE-013 Reporting Engine, Financial Statements & Printing — consumes arQueries.* sales analytics.
