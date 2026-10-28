# Document Lifecycle

> **Status:** STABLE · **Owner:** Accounting Domain Architecture · **Updated:** 2026-10-27

The unified state machine for business documents that carry financial/stock effects.
Applies to: sales invoices, credit notes, receipts, delivery notes, quotations, sales
orders, purchase orders, GRN, supplier invoices, debit notes, payments, stock
transfers/counts/adjustments, expenses, cash transfers, production orders. Variations per
type are noted below; any deviation requires a decision record.

## 1. Core state machine

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> PENDING_APPROVAL: submit (if approval policy applies)
  PENDING_APPROVAL --> APPROVED: approve
  PENDING_APPROVAL --> DRAFT: reject (with reason)
  DRAFT --> APPROVED: approve directly (policy: no approver required)
  APPROVED --> POSTED: post (assign official number + journals)
  DRAFT --> CANCELLED: cancel (before approval; audit-logged)
  PENDING_APPROVAL --> CANCELLED: cancel (permission + reason)
  POSTED --> REVERSED: reverse (creates counter-documents/journals)
  REVERSED --> [*]
  POSTED --> [*]
  CANCELLED --> [*]
```

## 2. State semantics (normative)

| State | Meaning | Editable? | Numbered? | Ledger effect |
|-------|---------|-----------|-----------|----------------|
| DRAFT | Work in progress | Yes (line-level) | No (temporary display id) | None |
| PENDING_APPROVAL | Submitted to approver(s) | No | No | None |
| APPROVED | Approved; awaiting posting | No | Reserved or assigned at approval (per numbering policy) | None |
| POSTED | Effective — immutable | **No — never** | Official number assigned (immutable) | Journals committed |
| REVERSED | Negated by a reversal document | No | Original number retained + reversal doc carries its own | Net zero (both visible) |
| CANCELLED | Abandoned before effect | No | Number voided/reserved forever (gap documented) | None |

**Rules:**

1. Approve → post may be one user action for low-risk documents (policy); the states are
   still distinct for audit, with auto-post recorded as `approved_by` vs `posted_by`
   (+policy flag).
2. Posted corrections are always **new documents** (credit/debit note, adjustment,
   reversal) referencing the original; never in-place edits (INV-003, INV-006).
3. `posted_at`, `posted_by`, `journal_entry_ids` are set by the posting transaction;
   `reversed_by_doc_id` links reversal pairs.
4. Official numbers are assigned at the moment the document becomes effective
   (approval-reserve or posting-assign, per tenant numbering policy) — gaps only via
   voided reservations, which stay queryable for audit (ADR-0006).
5. Every transition writes an audit event with before/after + reason (when applicable).

## 3. Per-type variations

| Document type | Variations |
|----------------|-----------|
| Quotation | No ledger path; states DRAFT → SENT → ACCEPTED(converts to order)/REJECTED/EXPIRED |
| Sales order | No ledger effect until delivery/invoice; may reserve stock (inventory hold) |
| Delivery note | POSTED issues stock (COGS journal) without AR; converts to invoice later |
| Sales invoice | Full chain per §1; cash invoices may auto-post on save (policy: `cash_sales_autopost`, default ON for POS) |
| Credit note | Must reference an invoice (or be standalone policy-flagged); reverses AR/revenue/VAT; returns re-enter stock at original issue cost |
| Receipt / Payment | DRAFT → POSTED (no approval by default; policy may add) — money moved must be final |
| Purchase order | DRAFT → ISSUED → (amendments as new revision linked) → CLOSED; GRN references |
| Goods receipt | POSTED receives stock + GRNI accrual |
| Supplier invoice | POSTED clears GRNI, posts AP; three-way match outcome recorded before approval |
| Debit note | Mirrors supplier invoice corrections |
| Stock transfer | DRAFT → IN_TRANSIT → POSTED (two-leg stock effect; in-transit visible, not sellable) |
| Stock count | DRAFT → COUNTED → VARIANCE_REVIEW → POSTED (adjustment journals) |
| Expense claim | DRAFT → PENDING_APPROVAL → APPROVED → POSTED (payout may be separate) |
| Cash transfer | DRAFT → POSTED |
| Production order | DRAFT → RELEASED → IN_PROGRESS → COMPLETED (post FG/WIP journals) / CANCELLED (before consumption) |

## 4. Offline interactions (summary — full matrix in
[../offline/OFFLINE_CAPABILITIES_MATRIX.md](../offline/OFFLINE_CAPABILITIES_MATRIX.md))

- Offline-created documents enter as `DRAFT` with client-generated UUIDv7 + local
  display number; the server owns approval/posting/numbering.
- Exception (POS sales, PHASE-016): offline terminal completes a sale locally with an
  **offline receipt number** (`OFF-…`); sync converts to a posted invoice with the
  official number recorded alongside; the offline number remains printed on that receipt
  for reconciliation. Local state shows "pending sync" honestly (ADR-0012).
- Rejected pushes (period locked, price changed beyond tolerance, credit limit) return
  the document to the device as actionable errors — never silently merged.

## 5. Status → UI mapping

Status badges, actions, and allowed transitions per state are part of the design system
document status component ([../ui/COMPONENT_CATALOG.md](../ui/COMPONENT_CATALOG.md));
the transition table above is the source of truth for the component's behavior map.
