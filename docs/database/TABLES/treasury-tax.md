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

## `warehouses` — branch-linked (PHASE-010)

Per-branch, tenant-scoped; code unique per tenant+branch; `is_active` soft deactivate.

## `item_warehouse_settings` — per-item per-warehouse defaults (PHASE-010)

`reorder_level` numeric(19,4), `min_qty`, `reorder_qty`; cost method inherited from items.costing_method.

## `stock_moves` — immutable ledger (PHASE-010, append-only 🔒)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` | uuid | no | — | UNIQUE(id,tenant_id) | — |
| `item_id`, `warehouse_id` | uuid | no | — | FK | — |
| `direction` | text | no | — | ck IN/OUT | — |
| `move_kind` | text | no | — | — | receipt/issue/transfer/adjust/opening |
| `qty` | numeric(19,4) | no | — | CHECK >0 | — |
| `unit_cost` | numeric(19,6) | no | — | 6dp | — |
| `value_amount` | numeric(19,4) | no | — | qty*unit_cost | — |
| `source_type/id` | text/uuid | no | — | — | provenance |
| `moved_at` | timestamptz | no | now() | tenant-first idx | — |

Append-only: REVOKE UPDATE/DELETE + trg_stock_moves_immutable.

## `stock_layers` — FIFO layers (PHASE-010)

Per receipt layer: qty, unit_cost, remaining_qty; consumed oldest-first; Σ remaining = item_stock.qty.

## `item_stock` — read model (PHASE-010)

Tenant/item/warehouse unique; qty numeric(19,4), avg_cost numeric(19,6) WAC; maintained transactionally with moves.

## `item_batches` / `item_serials` — tracking (PHASE-010)

Batches: batch_no unique per item+tenant, expiry_date; FEFO order. Serials: serial_no unique, status in_stock/sold/returned BR-018.

## `stock_transfers` / `stock_transfer_lines` — DRAFT→IN_TRANSIT→POSTED (PHASE-010)

Head: from/to warehouse, status, posted_journal_id (only distinct accounts G-15). Lines: item, qty.

## `stock_counts` / `stock_count_lines` — DRAFT→COUNTED→VARIANCE_REVIEW→POSTED (PHASE-010)

Head: warehouse, is_blind, snapshot_at. Lines: system_qty frozen, counted_qty, variance_qty, reason COUNT_LOSS/GAIN/EXPIRED/DAMAGE.

## `stock_reservations` — soft reservations (PHASE-010)

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `holder_type/id` | text/uuid | no | — | sales order etc |
| `qty` | numeric(19,4) | no | — | reserved |
| `expires_at` | timestamptz | no | — | TTL |
| `status` | text | no | ACTIVE | ACTIVE/EXPIRED/RELEASED |

Availability = onHand − reserved ACTIVE − inTransit; reorder job emits stock.below_reorder.

# purchasing update — PHASE-011 tables appended in same file (consolidated)
# Note: see section above for core inventory; purchasing below.

## `purchase_requests` / `purchase_request_lines` (PHASE-011)

Requisition header: tenant_id, branch_id, requested_by, pr_no, status DRAFT→PENDING_APPROVAL→APPROVED→REJECTED→CANCELLED; lines item_id qty.

## `purchase_orders` / `purchase_order_lines` (PHASE-011)

PO header: supplier_id, branch_id, order_no (BR-029 numbering INV-021), order_date, expected_date, status DRAFT→ISSUED→CLOSED, revision_of, totals, tax_summary, currency. Lines item qty unit_price amount + tax snapshot. Threshold BR-010 via tenant_settings.

## `goods_receipts` / `goods_receipt_lines` (PHASE-011)

GRN: po_id (nullable PO-less BR-012), warehouse_id, receipt_no, receipt_date, status DRAFT→POSTED→REVERSED, posted_journal_id. Lines item qty unit_cost amount batch_id expiry. Posts via inventory.receiveStock + G-07 DR INVENTORY CR GRNI.

## `supplier_invoices` / `supplier_invoice_lines` (PHASE-011)

Supplier invoice: supplier_id, invoice_no (supplier's), internal_no, po_id, grn_id, match_result jsonb (BR-009), status DRAFT→POSTED, invoice_date due_date, subtotal tax total, tax_summary INV-012, currency. Lines item qty unit_price amount tax_snapshot recovery RECOVERABLE/EXPENSED/NOT_SUBJECT. BR-011 duplicate (supplier,number,amount) blocked.

## `debit_notes` (PHASE-011)

AP correction referencing supplier_invoice, G-09 DR AP_CONTROL CR INVENTORY CR VAT_RECOVERABLE.

## `landed_costs` (PHASE-011 baseline)

grn_id, cost_type freight/customs/insurance/other, amount, allocation_method value/quantity, status DRAFT→POSTED, remaining-qty constraint + COGS-adjustment per INVENTORY_ACCOUNTING §3.

## `ap_allocations` / `payments` extension (PHASE-011)

ap_allocations payment_id→invoice_id amount INV-016 bounded; payments via treasury service G-10 DR AP_CONTROL CR CASH + FX. On-account remainder + reallocation audited.

## `accounts` purposes for purchasing

GRNI, AP_CONTROL, VAT_RECOVERABLE, VAT_EXPENSED, INVENTORY, CASH, FX_GAIN/LOSS.

## `quotations` / `quotation_lines` (PHASE-012)

header customer branch quote_no status DRAFT→SENT→ACCEPTED/REJECTED/EXPIRED valid_until BR-006 30d default; lines item qty unit_price discount tax snapshot.

## `sales_orders` / `sales_order_lines` (PHASE-012)

order header customer warehouse order_no status DRAFT→APPROVED→DELIVERED→INVOICED rep_id soft reservation expiry 60m non-blocking; lines item qty unit_price discount.

## `delivery_notes` / `delivery_note_lines` (PHASE-012)

DN header order customer warehouse delivery_no status DRAFT→POSTED cogs_journal_id; lines item qty unit_cost cogs_amount batch/serial; G-03 DR COGS CR INVENTORY via issueStock.

## `sales_invoices` / `sales_invoice_lines` (PHASE-012)

Invoice header customer branch order delivery invoice_no offline_receipt_no POS-reserved einvoice_status kind CREDIT/CASH status DRAFT→POSTED due_date currency FX numbering per branch/type INV-021; lines item qty unit_price discount tax_snapshot original_cost batch/serial BR-003 pricing + BR-002 ceiling + tax stamp BR-033 NOT_SUBJECT. Posts G-01/G-02/G-03 sequenced §5.

## `credit_notes` / `credit_note_lines` (PHASE-012)

Credit header customer ref_invoice credit_no status amount tax total return_stock boolean original cost re-entry; BR-004 window 14d mandatory reference; G-04 SALES_RETURNS/VAT_PAYABLE + DR INVENTORY CR COGS at original cost.

## `sales_reps` (PHASE-012 attribution only)

user_id code name commission_rate — no commission calc (PHASE-017); attribution on orders/invoices.

## `receipts` extension + `ar_allocations` (PHASE-012)

receipts via treasury (cash/bank/cheque) G-05/G-06 FX; ar_allocations receipt↔invoice INV-016 BR-027 on-account + FIFO suggestion + audited reallocation; aging deterministic as-of BR-028 RC-10.
