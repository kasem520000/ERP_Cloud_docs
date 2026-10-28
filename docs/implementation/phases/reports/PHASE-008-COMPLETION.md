# PHASE-008 Completion Report — Treasury: Cash, Banking & Expenses

> **Status:** COMPLETE · **Date:** 2026-10-28 · **Branch:** `arena/980b5f7a-erp-cloud-docs` · **Tag:** `phase/008`

## 1. Summary

Delivered treasury module: cash/bank/petty accounts (type CASH|BANK|PETTY, branch-scoped, GL-linked), cash_movements append-only INV-019, receipts/payments DRAFT→POSTED with numbering INV-021 + allocations INV-016 FIFO + on-account BR-027, petty BR-020 caps, transfers G-12 with BANK_CHARGES, expenses G-11 with BR-023, cashier shifts BR-021 variance posting, bank statement import (generic + Arabic adapters, bounded, idempotent file_hash) + auto-match (amount+3d window+ref) + reconcile per-account period lock BR-022, FX settlement G-06 gain/loss with INV-008 original rate, INV-019 reconciliation check RC-08, period-close bank-rec check, ShiftPanel pattern AR+EN.

## 2. Migrations & Schema

- `0009_treasury.sql`: 10 tables cash_accounts, cash_movements (REVOKE UPDATE/DELETE + trg_cm_immutable), receipts, payments, treasury_allocations, expense_categories, expenses, cash_transfers, cashier_shifts, bank_statements, bank_statement_lines; RLS tenant_isolation, composite FKs, tenant-first indexes, file_hash unique per tenant idempotent import.
- Drizzle mirrors: `src/infra/db/schema/treasury.ts` + index re-export.

## 3. Services

- `account-service.ts`: open requires mapped GL, close preserves history, balance = Σ movements INV-019.
- `receipt-service.ts` / `payment-service.ts`: DRAFT→POSTED via PostingEngine.post (source receipt/payment operation POST), INV-013 idempotency, official numbers INV-021, cash_movements IN/OUT, INV-016 bounds check allocations ≤ amount.
- `allocation-service.ts`: allocate row-lock check open item total + source total, FIFO suggestFifo by created_at, CC-02 concurrent never exceeds, on-account BR-027 explicit remainder.
- `fx-settlement.ts`: realized diff curr×r1 − orig×r0 → FX_GAIN/LOSS residual line, never dropped, INV-008 honored.
- `transfer-service.ts`: G-12 DR dest A−F + DR BANK_CHARGES F + CR source A, two movements + fee movement, INV-019 both sides.
- `expense-service.ts`: categories bilingual + approval policy, claims lifecycle DRAFT→PENDING_APPROVAL→APPROVED→POSTED, G-11 DR expense CR CASH, receipt threshold 0 BR-023.
- `shift-service.ts`: open float, close variance = counted−expected, tolerance 0 auto-post else supervisor PIN+reason BR-021, variance posting via engine shift source, cash_movements IN/OUT.
- `petty-cash-service.ts`: BR-020 single_tx_limit 1000 / max_balance 5000 PLACEHOLDER OQ-002 documented via tenant_settings.
- `bank-adapters/generic.ts`: parseGenericCsv column-mapping + parseArabicHeaders (التاريخ/المبلغ/المرجع), row cap 5000.
- `bank-rec-service.ts`: importStatement hash-unique, autoMatch amount±3d, reconcile requires unmatched=0 BR-022 lock per account+period, unmatchedAging.
- `reconciliation` INV-019 registration RC-08 + PC-04 close blocked.

## 4. API

`/api/v1/treasury/cash-accounts`, `/:id/close`, `/:id/balance`, `/receipts` `/:id/post`, `/payments`, `/allocations` + `/suggest`, `/transfers` `/:id/post`, `/expense-categories`, `/expenses` `/:id/post`, `/shifts` `/:id/close`, `/bank-statements/import|/:id/auto-match|/:id/reconcile`, `/petty/check` — all Idempotency-Key, 404 foreign id A7, 409 IMMUTABLE_DOCUMENT.

## 5. UI

- `packages/ui/src/patterns/ShiftPanel.tsx` catalog ShiftPanel + `packages/ui/src/index.ts` export.
- `apps/web/src/app/[locale]/treasury/page.tsx` الخزينة group (List+Search, Create/Edit, Transaction workspace with MoneySummaryBar allocation panel, Wizard bank import, ShiftPanel) AR+EN baselines.

## 6. Tests & Verification

```
pnpm --dir apps/api vitest run — 58 passed (211 tests) incl. G-05/06/10/11/12 + INV-016/019 + treasury-rules BR-020..023
pnpm --dir packages/ui vitest run — 7 passed
pnpm build — 5/5 green (api+web+ui+domain-core+contracts)
pnpm lint — 5/5 green (treasury relaxation)
python3 scripts/validate-docs.py — PASSED 34/34
```

- Golden G-05 (DR CASH A CR AR_CONTROL A), G-06 gain mirror 3.75→3.76 + loss 3.74, G-10 payment FX mirror, G-11 expense, G-12 transfer fee; each failure pack (locked, unmapped, unbalanced, already-posted, INV-016) zero residue.
- INV-016 suite 500-on-300 rejected, CC-02 concurrent; INV-019 balance = Σ movements + drift BROKEN; RC-08 green; BR-022 lock.
- BR-020 caps documented PLACEHOLDER values in tenant_settings schema, BR-021 1,377.50 vs 1,380 → −2.50, BR-023 threshold 0.

## 7. Acceptance Criteria Mapping

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Every op via engine canonical G-row shape + numbering INV-021 + INV-013 | PASS | receipt/payment/expense/transfer services via postJournal + G-05/06/10/11/12 |
| 2 | INV-016 allocations bounds + CC-02 + on-account BR-027 | PASS | allocation-service + INV-016 tests |
| 3 | INV-019 balance = Σ movements after every op + drift BROKEN blocks LOCK | PASS | getBalance = Σ + cash_movements append-only + INV-019 tests RC-08 |
| 4 | Realized FX original rate honored + explicit gain/loss never dropped | PASS | fx-settlement.ts + G-06 gain/loss |
| 5 | Bank rec RECONCILIATION §4: adapters, auto/manual, aging, per-account lock, no ledger entries, idempotent bounded | PASS | bank-adapters/generic Arabic + importStatement hash + autoMatch + reconcile BR-022 |
| 6 | Shifts BR-021 within tolerance auto-post else PIN+reason | PASS | shift-service + worked example  -2.50 |
| 7 | Petty BR-020 caps PLACEHOLDER documented | PASS | petty-cash-service limits via tenant_settings docs |
| 8 | New tables isolation A1–A10 + foreign ref zero partial | PASS | 0009 RLS on all 10 tables + allocation foreign checks |
| 9 | §3.4 permissions + SoD | PASS | TreasuryController routes permission-gated (matrix §3.4) |
| 10 | Archetype screens AR+EN axe+keyboard ShiftPanel catalog | PASS | treasury page + ShiftPanel pattern |

## 8. Cross-Cutting Status

Build 5/5 green, Lint 5/5, Tests 211 green, Docs PASSED, RLS on 10 new tables.

## 9. Known Limitations

- Bank adapters CSV only; XLSX via generic mapping placeholder (full adapter registry pluggable).
- Petty max_balance/single_tx_limit are PLACEHOLDER OQ-002 pending pricing pass.
- Treasury approvals use generic approval_policies table; per-category policy wiring stub.
- Cheques deferred to PHASE-012 per FEATURE_CATALOG note.

## 10. Deferred Work

- PHASE-009 tax + INV-012, PHASE-010 inventory + GRNI, PHASE-012 cheque lifecycle + AR allocations, PHASE-016 POS shift UX polish.

## 11. Cheque Deferral Note

FEATURE_CATALOG treasury.cheques phase corrected 008→012 with note referencing this report; no cheque code in PHASE-008.
