# Posting Engine

> **Status:** STABLE · **Owner:** Accounting Domain Architecture · **Updated:** 2026-10-27

The single domain service that turns business operations into ledger effects
([ADR-0007](../architecture/ADR/ADR-0007-centralized-posting-engine.md)). Lives in the
`accounting` module, depends on no infrastructure, and is the **only** writer of
`journal_entries`/`journal_lines`.

## 1. Service contract

```ts
interface PostingEngine {
  /** Post a journal specification as part of the caller's transaction. */
  post(spec: JournalSpec, ctx: TenantContext): Promise<PostingResult>;
  /** Reverse a posted entry with a reason; creates the counter-entry. */
  reverse(input: ReverseInput, ctx: TenantContext): Promise<PostingResult>;
  /** Check whether a date is postable (open period) without posting. */
  isDatePostable(date: CalendarDate, ctx: TenantContext): Promise<boolean>;
}

type JournalSpec = {
  source: { docType: DocumentType; docId: UUID; operation: string };  // e.g. 'post' | 'reverse' | 'fx_diff'
  entryDate: CalendarDate;            // posting date (defaults to document date; validated)
  description: LocalizedText;
  reference?: string;                 // official doc number once assigned
  currency: CurrencyCode;             // document currency
  exchangeRate?: decimal;             // required if currency ≠ base; stored on entry
  lines: JournalLineSpec[];           // 2..N, at least one debit and one credit
  idempotencyKey: string;             // posting-operation key, unique per (tenant, source)
};

type JournalLineSpec = {
  purpose?: AccountPurpose;           // OR explicit:
  accountId?: UUID;                   // direct account (manual journals)
  direction: 'debit' | 'credit';
  amount: Money;                      // document currency, > 0
  partnerId?: UUID;                   // AR/AP subledger lines must carry partner
  itemId?: UUID; costCenterId?: UUID;
  taxCodeId?: UUID;                   // tax-effect lines carry the tax code
  memo?: LocalizedText;
};
```

**Result**: `{ journalEntryId, entryNo, lines: [{lineNo, accountId, debit, credit, baseAmount}] }`
— errors are typed (`PostingError` codes below), never strings.

## 2. Validation pipeline (in order; first failure aborts)

1. **Idempotency check**: existing entry for `(tenant, source.docType, source.docId,
   source.operation)`? → return the stored result (INV-013). No new entry.
2. **Schema-level**: 2+ lines, ≥1 debit, ≥1 credit, all amounts > 0.
3. **Currency/FX**: currency exists; if ≠ base, rate required and > 0; compute base
   amounts; **balance must hold in base currency** (line-level FX rounding may not
   create drift — the caller must pre-balance; engine verifies).
4. **Period check**: `entryDate` in an OPEN fiscal period (INV-011); rejected if
   soft-closed-with-hard-rules or locked.
5. **Account resolution**: purposes → active account mappings; accounts are postable
   leaves (INV-004), active, currency-compatible (INV-005).
6. **Subledger consistency**: lines hitting AR/AP control purposes MUST carry a
   `partnerId` (INV-009); tax lines carry `taxCodeId`.
7. **Balanced entry**: Σdebit = Σcredit in document currency AND base currency (INV-001,
   INV-002), within 0 tolerance (rounding residuals must be explicit lines).
8. **Write phase**: insert journal entry (`POSTED` — no intermediate ledger state;
   approval happened on the document) + lines + audit event; update source document
   status/`postedJournalId`; write subledger rows (module-owned, in same transaction).

Reversal: loads original (must be `POSTED`, not already reversed — INV-014), creates a
counter-entry with mirrored directions (same accounts/partners/items; new entry date ≤
today and in an open period; rate = original rate for the same-currency reversal),
links `reversal_of_id`/`reversed_by_id`, marks original `REVERSED` (still counted in
history; net effect zero).

## 3. Error taxonomy (stable codes, localized messages)

| Code | Meaning |
|------|---------|
| `ENTRY_NOT_BALANCED` | INV-001/002 failure |
| `PERIOD_LOCKED` / `PERIOD_NOT_FOUND` | INV-011 failure |
| `ACCOUNT_NOT_POSTABLE` / `ACCOUNT_ARCHIVED` | group node / archived target |
| `CURRENCY_MISMATCH` | INV-005 failure |
| `PURPOSE_NOT_MAPPED` | required purpose has no account mapping — fail closed |
| `MISSING_PARTNER_ON_CONTROL` | AR/AP line without partner |
| `MISSING_FX_RATE` | foreign currency without rate |
| `ALREADY_POSTED` / `ALREADY_REVERSED` | INV-013/014 |
| `INVALID_AMOUNT` | ≤ 0 or non-decimal |

## 4. Posting rules by operation (canonical map)

| Operation (module) | Journal effect (debit / credit) |
|--------------------|----------------------------------|
| **Sales invoice — credit** (sales) | DR AR control (partner) · CR sales revenue (net) · CR VAT payable (per treatment) |
| **Sales invoice — cash** | DR cash/bank account · CR revenue · CR VAT payable |
| **Sales invoice — COGS** (with goods) | DR COGS · CR inventory (valuation at issue) |
| **Credit note** (sales) | Mirror of invoice (incl. stock re-entry at original cost for returns; discounts contra) |
| **Receipt from customer** (treasury) | DR cash/bank · CR AR control (partner); FX difference on settlement → FX_GAIN/LOSS |
| **Purchase — GRN** (purchasing) | DR inventory (or expense/asset account) · CR GRNI accrual (until supplier invoice) |
| **Supplier invoice** (purchasing) | DR inventory/expense · DR VAT recoverable (if eligible) · CR AP control (partner); clears GRNI |
| **Debit note** (purchasing) | Mirror of supplier invoice adjustment |
| **Payment to supplier** (treasury) | DR AP control · CR cash/bank; FX difference as above |
| **Expense** (treasury) | DR expense account (+ VAT recoverable where eligible) · CR cash/bank/petty |
| **Cash transfer** (treasury) | DR destination cash · CR source cash (+ bank charges expense) |
| **Stock adjustment — loss** (inventory) | DR shrinkage expense · CR inventory |
| **Stock adjustment — gain** (inventory) | DR inventory · CR appreciation account |
| **Stock transfer between valuation accounts** | DR inventory (dest. account) · CR inventory (source account) — only when branches map distinct accounts |
| **Opening balances** | Declared balances entry (DR customers/inventory/cash · CR suppliers/capital) with per-partner/per-item detail on subledgers |
| **Production order — completion** (manufacturing) | DR finished goods inventory · CR WIP (material+labor+overhead absorbed) |
| **Production — scrap** | DR production scrap expense · CR WIP |
| **FX revaluation run** (optional, dated) | DR/CR FX gain/loss vs revalued AR/AP/cash lines |
| **Year-end close** (accounting) | DR revenue accounts · CR closing; DR closing · CR expense accounts; net → retained earnings |

Every rule above is mirrored by a test fixture with **expected journal entries** (see
[../testing/ACCOUNTING_TESTS.md](../testing/ACCOUNTING_TESTS.md)).

**Extension gate (adopted from Folder 1):** every NEW posting operation added by a future
phase MUST complete a seven-way **effect matrix** row before implementation is approved —
(1) source-document state transition, (2) inventory/stock effect, (3) AR/AP subledger
effect, (4) cash/bank effect, (5) GL journal lines (the row of the table above),
(6) tax snapshot/summary effect, (7) audit event(s). The row is reviewed by the phase's
code review ([../implementation/templates/CODE_REVIEW_TEMPLATE.md](../implementation/templates/CODE_REVIEW_TEMPLATE.md)),
and the operation's G-scenario in the golden-test battery must assert all seven cells
(postconditions, not just journal lines). An operation whose matrix row cannot be
completed is not fully specified and may not ship.

## 5. Sequencing example (credit invoice with goods)

```
transaction:
  salesInvoice.approve()
    ├─ inventory.issueStock()        → stock_moves rows
    ├─ PostingEngine.post(cogsSpec)   → COGS/inventory journal
    ├─ taxEngine.stamp(doc)           → tax summary on document
    ├─ PostingEngine.post(arSpec)     → AR/revenue/VAT journal
    ├─ partners.addSubledgerEntries() → invoice rows on partner ledger
    └─ audit.record(...)             → audit_events
  COMMIT
```

Partial failure ⇒ full rollback; the document remains in its prior state with the
typed error surfaced.

## 6. Performance and concurrency

- Idempotency via unique index `(tenant_id, source_type, source_id, operation)` —
  concurrent duplicate posts serialize on insert conflict and return the existing entry.
- Entry numbering: per-tenant sequence (`JE-{yyyy}-{seq:6}`) assigned inside the
  transaction; contention is per-tenant only.
- All queries index on `(tenant_id, entry_date)` / `(tenant_id, account_id)`.

## 7. Out of scope (explicit)

- No user-defined posting formulas ("scriptable accounting") — purposes + module rules
  only (directive §1.15).
- No posting outside open periods, including "temporary" entries.
- No direct API to insert journal lines — even manual journals go through the engine's
  `post()` with source `journal_entry` (user-created, approval-gated).
