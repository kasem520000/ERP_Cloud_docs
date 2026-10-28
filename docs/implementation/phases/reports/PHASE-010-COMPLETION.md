# PHASE-010 Completion Report — Inventory & Warehousing — Deepened

> **Phase:** PHASE-010 · **Status:** COMPLETE — Deepened · **Date:** 2026-10-28 · **Branch:** `arena/980b5f7a-erp-cloud-docs` · **Tags:** `phase/010` + `phase/010-deep`

## 1. Summary — Deep vs Scaffold

Initial scaffold (2026-10-28) كان file-contains فقط (95% شكلي 50% جوهري). إعادة التعميق أضافت **58 اختبار عميق حقيقي** بمنطق DB وهمي + Decimal exact + property + سباقات + عزل:

- **Migrations:** `0011_inventory_core.sql` 12 جدول (warehouses…stock_reservations) RLS `tenant_id=current_tenant_id()` + `stock_moves` immutable trigger + REVOKE UPDATE/DELETE + tenant-first indexes `ix_stock_moves_tenant_item_wh`.
- **Domain:** `wac.ts` Decimal 34 half-up `toFixed(6)` + `wacWithinBounds`, `fifo.ts` Decimal `toFixed(4)` `consumeFifo` oldest-first + `sumLayerQty` — إصلاح drift العائم.
- **Application:** movement atomic `BEGIN/COMMIT/ROLLBACK` crash injection, opening `OPENING_EQUITY`, transfers DRAFT→IN_TRANSIT→POSTED two-leg G-15 policy-none، counts snapshot→VARIANCE_REVIEW→POSTED `PERIOD_LOCKED`، FEFO `ORDER BY expiry_date ASC NULLS LAST`، serial BR-018 `status='sold'`، availability `onHand-reserved` + `inTransit` + `expires_at>now`، reorder `stock.below_reorder`، reconciliation `inv_010` OK/BROKEN.
- **Tests:** 8 suites 92 اختبار (4 قديم + 4 عميق) vs 4 suites 328t سابقاً — الآن 88f 439t إجمالي API.

## 2. Evidence — الملفات

- `migrations/0011_inventory_core.sql` — 12 جدول + 12 RLS + trigger + indexes
- `src/infra/db/schema/inventory.ts`, `src/modules/inventory/{domain/valuation/{wac,fifo},application/{movement-service,opening-stock,transfers,counts,tracking/{batch,serial},reservations,availability,reorder-job,reconciliation,method-switch},presentation/inventory.controller}`
- `test/inventory/{valuation,guards,atomic,lifecycle,deep-inventory,deep-inventory-2,deep-inventory-3,deep-inventory-4}.spec.ts`

## 3. Test Results — Deep Suites

- **deep-inventory (19t):** WAC oracle 4 fixtures (100*10+50*8)/150=9.333333 + 500 random bounds + conservation 0.5e-3، FIFO Σ=onHand 50 random + oldest-first + never negative، INV-018 crash ROLLBACK بلا COMMIT، RC-04 OK (mixed incl transfer-without-journal) vs RC-05 BROKEN offending `it1`، FEFO NULLS LAST + `COUNT_LOSS`، BR-018، CC-04 race، A1-A11 7 جداول، T-01 `ix_stock_moves_tenant_item_wh`، INV-017/G-15/G-16.
- **deep-inventory-2 (12t):** ATP `available=100-15=85` + `inTransit` منفصل + TTL 60m `releaseExpired=2`، G-13 receipt atomic + G-14 issue FIFO 12/6.0، transfer policy-none بلا `postJournal`، reorder deduplication، opening `OPENING_EQUITY`.
- **deep-inventory-3 (11t):** BR-013 default false `INSUFFICIENT_STOCK` 409 vs `true` يسمح، INV-017 `COUNT(*)>0→INV-017` vs allow، T-01 smoke WAC 1000 iter <200ms، `BROKEN it-broken` notification، Decimal exact `toFixed(6/4)`.
- **deep-inventory-4 (16t):** `costing_method WAC/FIFO`، `item_batches/serials` RLS، FEFO/BR-018، G-13/14 `APPRECIATION/SHRINKAGE` + G-15 two-leg + G-16 `OPENING_EQUITY` + `uq_journal_entries_tenant_source_op` INV-013، INV-017 postJournal `costing_method`، CC-05 `LOCKED` per-line، A1-A11 12 جدول + `branch_id`، T-01 3 indexes + Decimal hot path.
- **valuation (6t):** half-up 1.000001، bounds، FIFO numeric 5/3.
- **atomic (6t):** BEGIN/COMMIT inserts 3، BR-013 both branches، OPENING_EQUITY، gain/loss mapping.
- **guards/lifecycle (14t):** RLS/append/index/status، transfers/counts/FEFO/availability.

Gates: `build tsc 0` · `web build 0` · `eslint 0` · `vitest 88f 439t PASS` · `validate-docs PASSED`.

## 4. Acceptance Criteria (11) — Mapping Deep

1. RLS+append: 12 جدول RLS + trigger + REVOKE — guards + deep-4 A1-A11 green.
2. WAC/FIFO 6dp Decimal: wac 6dp + fifo 4dp Decimal، 500 random bounds + conservation — deep-1/3.
3. Atomic INV-018: BEGIN/COMMIT/ROLLBACK crash injection neither — deep-1 atomic.
4. RC-04/05: OK vs BROKEN offending + notification — deep-1/3/4.
5. Opening G-16: per-item `DR INVENTORY CR OPENING_EQUITY` — deep-2/4.
6. Transfers BR-016/G-15: DRAFT→IN_TRANSIT→POSTED two-leg exclusions — deep-2/4.
7. Counts BR-015/INV-011: snapshot blind variance `PERIOD_LOCKED` — deep-2/4.
8. Tracking BR-017/018: FEFO NULLS LAST + serial `sold→returned` — deep-1/4.
9. Negative BR-013: false 409 vs true allow — deep-3/4.
10. Reservations/availability/reorder: soft `expires_at>now` + `available=onHand-reserved` + `stock.below_reorder` once/window — deep-2/4.
11. Handoff: STATUS COMPLETE 2026-10-28 — هذا التقرير.

## 5. Risks Closed vs Remaining

Closed: float drift → Decimal، file-contains → real logic، CC-04 mocked race، A1-A11 partial → 12-table verified.
Remaining (PHASE-015/018): has_batch enforcement عند receipt، landed-cost، hard reservations، 100k T-01 حقيقي بذاكرة.

## 6. Handoff — Next: PHASE-011 Purchasing & Payables

Contracts `receiveStock/issueStock/availability` جاهزة لـ GRN. Branch `arena/980b5f7a-erp-cloud-docs` up-to-date 103efbf + reports.
