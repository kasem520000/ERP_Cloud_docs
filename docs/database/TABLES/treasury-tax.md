# TABLES — Treasury & Tax Cluster

> **Status:** STABLE · **Owner:** Database Architecture · **Updated:** 2026-10-28 · **Phases:** 008 (treasury), 009,023 (tax)

## `cash_accounts` — cash/bank/petty (PHASE-008)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` **+standard** | — | — | — | `UNIQUE (id, tenant_id)`; `uq_cash_accounts_tenant_code` | — |
| `code` | text | no | — | — | Per-tenant code |
| `name` / `name_ar` | text | no / yes | — | — | Bilingual |
| `type` | text | no | — | ck `CASH|BANK|PETTY` | Fund type |
| `account_id` | uuid | no | — | FK → accounts(id,tenant_id) | GL account IS ledger |
| `branch_id` | uuid | yes | — | FK → branches | optional |
| `currency_code` | char(3) | no | `SAR` | FK currencies | |
| `status` | text | no | `OPEN` | ck `OPEN|CLOSED` | Close preserves history |

## `cash_movements` — immutable ledger (PHASE-008, append-only 🔒)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` | — | — | — | `UNIQUE (id, tenant_id)` | — |
| `cash_account_id` | uuid | no | — | FK cash_accounts | |
| `direction` | text | no | — | ck `IN|OUT` | |
| `amount` | numeric(19,4) | no | — | `CHECK (amount>0)` | |
| `currency_code` | char(3) | no | — | — | |
| `source_type` | text | no | — | — | receipt/payment/transfer/expense/shift |
| `source_id` | uuid | no | — | — | — |
| `value_date` | date | no | — | — | — |

INV-019 substrate: balance = Σ movements; append-only grants + trg_cm_immutable.

## `receipts` / `payments` — treasury docs (PHASE-008)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` **+standard** | — | — | — | `UNIQUE (id, tenant_id)`; `UNIQUE (tenant_id, receipt_no)` | — |
| `cash_account_id` | uuid | no | — | FK cash_accounts | |
| `partner_id` | uuid | yes | — | FK partners | nullable for on-account |
| `amount` | numeric(19,4) | no | — | `CHECK >0` | |
| `currency_code` | char(3) | no | `SAR` | — | |
| `exchange_rate` | numeric(19,8) | no | `1` | `CHECK >0` INV-008 | |
| `status` | text | no | `DRAFT` | ck `DRAFT|POSTED|REVERSED` | |

Allocations in `treasury_allocations` (source_type, source_id, open_item_id, amount) with INV-016 bounds.

## `cash_transfers` — account↔account (PHASE-008)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` **+standard** | — | — | — | — | — |
| `from_account_id` / `to_account_id` | uuid | no | — | FK cash_accounts | |
| `amount` | numeric(19,4) | no | — | `CHECK >0` | |
| `fee_amount` | numeric(19,4) | no | `0` | `CHECK >=0` → BANK_CHARGES | |
| `value_date` | date | no | — | — | — |
| `status` | text | no | `DRAFT` | ck `DRAFT|POSTED|REVERSED` | |

G-12: DR dest A−F · DR BANK_CHARGES F · CR source A.

## `expense_categories` / `expenses` — BR-023 (PHASE-008)

Expense categories: code, name, account_id (expense GL), approval_policy. Expenses: category_id, cash_account_id, amount, receipt_file_id, status DRAFT→PENDING_APPROVAL→APPROVED→POSTED.

## `cashier_shifts` — BR-021 (PHASE-008)

opening_float, expected_amount, counted_amount, variance, status OPEN|CLOSED, variance_posted_journal_id.

## `bank_statements` / `bank_statement_lines` — BR-022 (PHASE-008)

Statements: cash_account_id, period_start/end, file_hash UNIQUE per tenant (idempotent), status IMPORTED|MATCHED|RECONCILED. Lines: statement_id, value_date, amount, reference, matched_movement_id, matched_at. Auto-match amount+window 3d+reference, unmatched aging, period lock RECONCILED.

## `tax_treatments` — global (PHASE-009)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `key` | text | no | — | PK | STANDARD_RATED etc (6) |

## `jurisdictions` — global packs (PHASE-009)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `country_code` | char(2) | no | — | PK | SA/AE/BH/KW/OM/QA/YE/EG/JO/IQ |
| `vat_status` | text | no | — | ck VAT_IN_FORCE/VAT_PLANNED/NO_VAT | |
| `pack_version` | text | no | `1.0.0` | — | |

## `jurisdiction_tax_rates` — versioned (PHASE-009)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK | |
| `country_code` | char(2) | no | — | FK jurisdictions, idx country+treatment+from | |
| `treatment` | text | no | — | FK tax_treatments | |
| `rate` | numeric(7,4) | no | — | CHECK 0..1 | |
| `effective_from/to` | date | no/yes | — | — | history windows |
| `source_ref` | text | no | — | — | official source |
| `verified_at` | timestamptz | yes | NULL | — | REQUIRES_VERIFICATION |

## `tax_codes` — tenant (PHASE-009)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` **+standard** | — | — | — | `UNIQUE(id,tenant_id)` `UNIQUE(tenant_id,code)` | |
| `code` | text | no | — | tenant-unique | |
| `jurisdiction_code` | char(2) | no | — | FK jurisdictions | |
| `treatment` | text | no | — | FK tax_treatments | |
| `rate` | numeric(7,4) | no | — | — | snapshot rate |

## `tax_registrations` — tenant (PHASE-009)

Per-jurisdiction REGISTERED/NOT_REGISTERED/DEREGISTERED, migrated from PHASE-004 settings.

## `e_invoicing_submissions` — schema only (PHASE-009, impl 023)

doc_type, doc_id, adapter_id, status PENDING→ACCEPTED/REJECTED, payload/response files.
