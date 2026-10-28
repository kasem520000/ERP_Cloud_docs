# Offline Capabilities Matrix

> **Status:** STABLE · **Owner:** Offline & API Architecture · **Updated:** 2026-10-27

The authoritative operation × device-class matrix required by directive §12 and
[ADR-0012](../architecture/ADR/ADR-0012-offline-sync.md). UI gating, sync scope, and test
coverage are all derived from this table — if an operation is not listed, it is
ONLINE-ONLY everywhere by default ([OFFLINE_ARCHITECTURE.md](OFFLINE_ARCHITECTURE.md) §3,
fail closed).

## 1. How to read

- **Device classes**: POS terminal (Tauri POS, PHASE-016) · Desktop (Tauri, PHASE-021) ·
  Android field (van sales/collectors, PHASE-022) · Personal account (customer/supplier
  view, PHASE-022).
- **Values** (capability classes, [OFFLINE_ARCHITECTURE.md](OFFLINE_ARCHITECTURE.md) §3):
  - **OFFLINE-COMPLETE** — finishes locally, queued as idempotent command; official
    effects assigned by server at sync.
  - **OFFLINE-DRAFT** — draft create/edit offline; submit/approve/post online.
  - **LOCAL-VALID** — OFFLINE-DRAFT with local pre-validation (advisory; server decides).
  - **READ-CACHED** — view from pulled read models; no offline writes.
  - **ONLINE-ONLY** — requires live server connection.
- **Conflict policy** ([CONFLICT_RESOLUTION.md](CONFLICT_RESOLUTION.md) §2):
  SD = server-decision · SAS = server-authoritative snapshot · FM = field merge
  (non-constrained) · OD = owner-device-wins · RO = read-only · n/a.
- **Post-sync state machine**: the honest local statuses the device displays
  ([../accounting/DOCUMENT_LIFECYCLE.md](../accounting/DOCUMENT_LIFECYCLE.md) §4);
  `REJECTED(editable)` always offers the typed actions of
  [CONFLICT_RESOLUTION.md](CONFLICT_RESOLUTION.md) §3.
- **Phase**: first phase in which the row is implemented
  ([../planning/MASTER_ROADMAP.md](../planning/MASTER_ROADMAP.md)).

## 2. Matrix

| # | Operation | POS terminal | Desktop | Android field | Personal acct | Conflict policy | Post-sync state machine | Phase |
|---|-----------|--------------|---------|---------------|---------------|-----------------|--------------------------|-------|
| 1 | POS sale (cash/card at counter) | **OFFLINE-COMPLETE** | — | — | — | SD | `PENDING_SYNC → POSTED` (official no. replaces `OFF-…`) or `PENDING_SYNC → REJECTED(editable)` | PHASE-016 |
| 2 | POS return/refund against receipt | **OFFLINE-COMPLETE** (credit note draft locally, cash refunded from drawer) | — | — | — | SD | `PENDING_SYNC → POSTED` (credit note + cash out) or `→ REJECTED(editable)` | PHASE-016 |
| 3 | Cashier shift open/close (float, count) | **OFFLINE-COMPLETE** (events queued) | — | — | — | SD | `PENDING_SYNC → POSTED` (shift record + variance) | PHASE-016 |
| 4 | Items / barcodes / prices lookup | **READ-CACHED** | READ-CACHED | READ-CACHED | — | SAS | cache as-of cursor; no local writes | PHASE-016 |
| 5 | Price list view | **READ-CACHED** | READ-CACHED | READ-CACHED | — | SAS | as #4 | PHASE-016 |
| 6 | Sales invoice draft (back office) | — | **OFFLINE-DRAFT** | **LOCAL-VALID**† | — | OD (draft), SD at submit | `DRAFT_LOCAL → DRAFT`; on submit online: server lifecycle | PHASE-021 / 022 |
| 7 | Quotation draft | — | **OFFLINE-DRAFT** | **LOCAL-VALID**† | — | OD | `DRAFT_LOCAL → DRAFT` | PHASE-021 / 022 |
| 8 | Receipt — POS cash collection | **OFFLINE-COMPLETE** | — | — | — | SD | `PENDING_SYNC → POSTED` | PHASE-016 |
| 9 | Receipt — field collection (van route) | — | — | **OFFLINE-COMPLETE** | — | SD (credit-limit/period checked server-side) | `PENDING_SYNC → POSTED` or `→ REJECTED(editable)` | PHASE-022 |
| 10 | Delivery note | — | **OFFLINE-DRAFT** | — | — | SD at submit (stock issue) | `DRAFT_LOCAL → DRAFT` | PHASE-021 |
| 11 | Stock count entry (lines as counted) | **OFFLINE-DRAFT** (POS-lite) | **OFFLINE-DRAFT** | **OFFLINE-DRAFT** | — | SD (aggregate; variance posted server-side only) | `DRAFT_LOCAL → DRAFT → COUNTED` (rest online) | PHASE-021 / 022 |
| 12 | Van load / unload confirmation | — | — | **OFFLINE-COMPLETE** (against van snapshot) | — | SD | `PENDING_SYNC → POSTED` (van ledger) or `→ REJECTED(editable)` | PHASE-022 |
| 13 | Customer statement view | — | **READ-CACHED** | **READ-CACHED** | **READ-CACHED** | RO | as-of-cursor label; stale is labeled, never guessed | PHASE-022 |
| 14 | Invoice view (issued, own documents) | — | **READ-CACHED** | **READ-CACHED** | **READ-CACHED** (authorized rows only) | RO | as #13 | PHASE-022 |
| 15 | Journal entry (manual) | — | **ONLINE-ONLY** | — | — | n/a | n/a — engine-only writer ([../accounting/POSTING_ENGINE.md](../accounting/POSTING_ENGINE.md) §7) | PHASE-007 |
| 16 | Approval (any document) | — | **ONLINE-ONLY** | **ONLINE-ONLY** | — | n/a | n/a | PHASE-007 |
| 17 | Posting (finalization) | — | **ONLINE-ONLY** | — | — | n/a | n/a — official numbers + ledger server-side only | PHASE-007 |
| 18 | Period close / open / lock | — | **ONLINE-ONLY** | — | — | n/a | n/a | PHASE-007 |
| 19 | Tax submission (e-invoice clearance/reporting, VAT return) | — | **ONLINE-ONLY** | — | — | n/a | n/a — authority acceptance never inferred locally ([../localization/E_INVOICING_ARCHITECTURE.md](../localization/E_INVOICING_ARCHITECTURE.md)) | PHASE-023 |
| 20 | Admin actions (users, roles, plans, entitlements) | — | **ONLINE-ONLY** | — | — | n/a | n/a | PHASE-004 |
| 21 | Partner edit — contact fields (phone, email, address) | — | **OFFLINE-DRAFT** | **OFFLINE-DRAFT** | — | FM (field merge, audited) | `PENDING_MERGE → MERGED` (or `→ REJECTED(editable)` for constrained fields) | PHASE-021 / 022 |
| 22 | Partner edit — constrained fields (credit limit, terms, status) | — | **ONLINE-ONLY** | — | — | SD | n/a | PHASE-006 |
| 23 | Partner create (new walk-in / route customer) | **OFFLINE-DRAFT** | **OFFLINE-DRAFT** | **LOCAL-VALID**† | — | SD (code/duplicate checks server-side) | `DRAFT_LOCAL → DRAFT` | PHASE-016 / 021 / 022 |
| 24 | Item edit / create | — | **ONLINE-ONLY** | — | — | SD | n/a — master data integrity is server-owned | PHASE-006 |
| 25 | Expense entry (field/back office) | — | **OFFLINE-DRAFT** | **OFFLINE-DRAFT** | — | SD | `DRAFT_LOCAL → DRAFT` | PHASE-021 / 022 |
| 26 | Stock transfer draft | — | **OFFLINE-DRAFT** | — | — | SD | `DRAFT_LOCAL → DRAFT` (IN_TRANSIT/POSTED online) | PHASE-021 |
| 27 | Credit note (van return from customer) | — | — | **OFFLINE-DRAFT** | — | SD | `DRAFT_LOCAL → DRAFT`; posting online | PHASE-022 |
| 28 | Personal-account online payment | — | — | — | **ONLINE-ONLY** (deferred, OQ-007) | n/a | n/a | post-MVP decision |
| 29 | Notifications / message read state | — | — | — | **READ-CACHED** | RO | cursor-labeled | PHASE-022 |
| 30 | Reports / financial statements | — | **ONLINE-ONLY** (report engine) | **ONLINE-ONLY** | — | n/a | n/a — GL-accuracy reads must be live ([../reporting/REPORT_CONTRACT.md](../reporting/REPORT_CONTRACT.md)) | PHASE-013 |
| 31 | POS on-account (credit) sale to known customer | **LOCAL-VALID**† (cached credit check; hard server decision) | — | — | — | SD | `PENDING_SYNC → POSTED` or `→ REJECTED(editable)` (`CREDIT_LIMIT_EXCEEDED`) | PHASE-016 |
| 32 | Reprint of an already-POSTED receipt/invoice | **OFFLINE-COMPLETE** (from local cache of synced docs) | **OFFLINE-COMPLETE** (cache) | — | — | RO | no state change; print templates local | PHASE-016 / 021 |
| 33 | Master-data search (items, partners) | **READ-CACHED** | **READ-CACHED** | **READ-CACHED** | — | SAS | cache as-of cursor | PHASE-016 / 021 / 022 |
| 34 | Cash transfer / drawer drop | — | **OFFLINE-DRAFT** | — | — | SD | `DRAFT_LOCAL → DRAFT` | PHASE-021 |
| 35 | Serial/IMEI or batch capture on sale line (where tracked) | **LOCAL-VALID**† (uniqueness checked against snapshot; server re-checks) | — | **LOCAL-VALID**† | — | SD | `PENDING_SYNC → POSTED` or `→ REJECTED(editable)` (`VALIDATION_ERROR` on serial reuse) | PHASE-016 / 022 |
| 36 | Tenant settings / numbering policy / CoA changes | — | **ONLINE-ONLY** | — | — | n/a | n/a — configuration correctness requires the live server | PHASE-004 / 007 |

† LOCAL-VALID = LOCALLY-VALIDATED-PENDING-SERVER: local pre-validation against pulled
snapshots (prices, van stock, tax rates) for immediate feedback; the server decision at
sync is final and may still reject.

## 3. Row notes (normative detail)

- **#1–#3 (POS)**: the only OFFLINE-COMPLETE financial flows at launch. Local receipt
  printing shows the `OFF-…` number and "pending sync" state
  ([OFFLINE_ARCHITECTURE.md](OFFLINE_ARCHITECTURE.md) §5.2). Drawer cash effects are
  real business facts recorded in the shift record; ledger effects exist only after
  server ACCEPTED.
- **#2**: refunds against an UNSYNCED same-shift receipt are allowed locally (both
  commands queue in order — the refund command references the sale's `commandId` chain,
  and the server enforces document-before-lines ordering,
  [SYNC_PROTOCOL.md](SYNC_PROTOCOL.md) §6).
- **#4–#5**: prices/tax are pull-only; any price the terminal uses is a stamped snapshot
  — at sync the server re-validates and returns `PRICE_CHANGED` beyond tolerance
  ([CONFLICT_RESOLUTION.md](CONFLICT_RESOLUTION.md) §3).
- **#6–#7**: drafts are owner-device-wins; other devices see read-only after first sync
  ([CONFLICT_RESOLUTION.md](CONFLICT_RESOLUTION.md) §6).
- **#11**: counted quantities are facts; variance calculation and adjustment posting are
  server-only ([../accounting/DOCUMENT_LIFECYCLE.md](../accounting/DOCUMENT_LIFECYCLE.md) §3
  "Stock count").
- **#13–#14**: personal-account rows are filtered by partner authorization server-side
  before entering the feed ([LOCAL_DATABASE.md](LOCAL_DATABASE.md) §1.1) — the device
  cannot pull anyone else's data even if tampered.
- **#15–#20, #22, #24, #28, #30**: ONLINE-ONLY rows are disabled in the UI with the
  reason "requires connection"; no simulated/queued behavior is permitted
  (state honesty, [OFFLINE_ARCHITECTURE.md](OFFLINE_ARCHITECTURE.md) §5).
- **#21**: the ONLY field-merge row — limited to explicitly listed non-constrained
  contact fields; every merge writes a field-level audit event
  ([CONFLICT_RESOLUTION.md](CONFLICT_RESOLUTION.md) §2).
- **#31**: the POS credit sale is LOCAL-VALID, not OFFLINE-COMPLETE: the cash-and-carry
  completion is local, but the customer's credit decision is server-checked at sync — a
  `CREDIT_LIMIT_EXCEEDED` rejection starts the standard refund/void flow at the terminal
  with the manager's authorization.
- **#32**: reprinting a posted document offline is a cache read of already-synced rows —
  it never re-creates or re-numbers anything; templates are local
  ([ADR-0011](../architecture/ADR/ADR-0011-reporting-printing.md)).
- **#35**: serial/IMEI uniqueness is re-verified server-side at sync (the snapshot can be
  stale); a serial sold twice surfaces `VALIDATION_ERROR` with both command references —
  the second device resolves manually (offline serial double-sell is a reconciliation
  case, not a system-guaranteed-impossible case; stock quantity is the guaranteed check).
- **#36**: configuration reads may be cached for display, but every configuration WRITE is
  ONLINE-ONLY — an offline device must never queue a numbering-policy or CoA change.

## 4. Device-class scope summary (derivable check)

The matrix MUST stay consistent with the local subsets of
[LOCAL_DATABASE.md](LOCAL_DATABASE.md) §1.1 — every OFFLINE-COMPLETE/OFFLINE-DRAFT cell
implies the referenced data is in the device's mirrored subset:

| Device class | Write capabilities (union of rows) | Read capabilities (union of rows) | Implied local subset
|--------------|-------------------------------------|-----------------------------------|----------------------
| POS terminal | sales, receipts, shifts, returns, partner-create, count lines | items/prices/barcodes, partners lite, tax snapshots | POS subset (LOCAL_DATABASE §1.1)
| Desktop | drafts (invoices, quotations, delivery notes, transfers, expenses, partner contacts), partner-create, count lines | broad read cache of user's modules | desktop cache + write set
| Android field | van sales, collections, van load/unload, returns, partner-create, count lines | POS subset + van stock + routes + statements | field subset
| Personal account | none | own statements/invoices/receipts/notifications | personal read models

A cell change that requires new mirrored data is a review flag: the local schema
migration must exist in the same phase.

## 5. Maintenance rules

1. Adding a row or changing a cell = decision record + CHANGELOG (this matrix is
   normative scope, not documentation commentary).
2. Every OFFLINE-COMPLETE / OFFLINE-DRAFT / LOCAL-VALID cell must reference a conflict
   policy and define its post-sync state machine — empty cells in those columns are
   review blockers.
3. The matrix is cross-checked at phase exit against the implemented capability gates
   (UI permission + sync scope) — the completion report for PHASE-016/020/021/022 quotes
   this table row-by-row ([../implementation/templates/COMPLETION_REPORT_TEMPLATE.md](../implementation/templates/COMPLETION_REPORT_TEMPLATE.md)).
4. Cells marked for a phase earlier than the generalized foundation (PHASE-020) are
   scoped-subset implementations governed by [SYNC_PROTOCOL.md](SYNC_PROTOCOL.md) §11.
