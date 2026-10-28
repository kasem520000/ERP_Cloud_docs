# Business Workflows

> **Status:** STABLE · **Owner:** Product & Platform Architecture · **Updated:** 2026-10-27

The canonical operational workflows, drawn as executable design references. Every workflow
states its **entry conditions**, the **document states traversed** (per
[../accounting/DOCUMENT_LIFECYCLE.md](../accounting/DOCUMENT_LIFECYCLE.md)), the **postings
generated** (accounts named by purpose — see [../accounting/CHART_OF_ACCOUNTS.md](../accounting/CHART_OF_ACCOUNTS.md)),
and its **failure exits**. Detailed user-level pacing lives in
[USER_JOURNEYS.md](USER_JOURNEYS.md); the rule catalog governing decisions is
[BUSINESS_RULES.md](BUSINESS_RULES.md).

## 1. Order-to-cash — cash variant (retail-style, PHASE-012; POS variant PHASE-016)

**Entry conditions.** Item exists with price and tax code; customer is walk-in or registered;
cash account configured; period OPEN.

**States traversed.** Sales invoice: DRAFT → (APPROVED) → POSTED. Delivery may be implicit
(counter sale issues stock directly with the invoice) per template. Receipt: DRAFT → POSTED.

```mermaid
flowchart TD
  A[New sale] --> B{Customer known?}
  B -- walk-in --> C[Invoice DRAFT<br/>cash kind]
  B -- registered --> D[Credit policy check BR-001]
  D -- pass/warn --> C
  D -- blocked --> E[Exit: credit block<br/>require cash or approval]
  C --> F[Post invoice + receipt atomically]
  F --> G[Issue stock at valuation]
  G --> H[Print receipt/invoice]
  H --> I[End: POSTED]
  F -. period locked .-> X1[Exit: INV-011 rejection]
  F -. stock negative & policy off .-> X2[Exit: BR-013 rejection]
  F -. tax snapshot invalid .-> X3[Exit: recompute draft]
```

**Postings (one transaction, INV-006/018).** DR cash account · CR revenue (net) · CR
`VAT_PAYABLE` (registered tenants); DR `COGS` · CR `INVENTORY` at issue cost; cash sales may
auto-post on save (`policy.sales.cash_autopost`, default ON for POS — BR-005).

**Failure exits.** Credit block (BR-001 blocked posture); negative stock (BR-013, default
off); locked period (INV-011); tax snapshot mismatch → draft recompute, never a silent
post; duplicate submit → idempotent no-op (INV-013).

## 2. Order-to-cash — credit variant (distribution-style, PHASE-012)

**Entry conditions.** Registered customer with credit terms and limit; stock available at
the issuing warehouse; approval thresholds configured (BR-010).

**States traversed.** Quotation: DRAFT → SENT → ACCEPTED. Sales order: DRAFT → CONFIRMED.
Delivery note: DRAFT → POSTED. Sales invoice: DRAFT → APPROVED → POSTED. Receipt: DRAFT →
POSTED with allocations.

```mermaid
flowchart TD
  Q[Quotation] -->|accepted| O[Sales order CONFIRMED]
  O --> DN[Delivery note POSTED<br/>stock issued, COGS posted]
  DN --> INV[Invoice DRAFT from DN]
  INV --> CHK{Credit limit check BR-001}
  CHK -- "block" --> AP1[Approval escalation or split shipment]
  AP1 --> INV
  CHK -- "pass/warn" --> APP{Amount threshold BR-010}
  APP -- above --> AP2[Owner/approver approves]
  AP2 --> P
  APP -- below --> P[Invoice POSTED<br/>AR + revenue + VAT]
  P --> REC[Receipt with allocations INV-016]
  REC --> AGE{Settled in terms?}
  AGE -- yes --> DONE[End]
  AGE -- no --> OD[Overdue notifications<br/>invoice.overdue]
  O -. amended --> O2[New revision linked<br/>original retained]
  INV -. correction --> CN[Credit note referencing invoice<br/>stock re-entry at original cost]
```

**Postings.** Delivery: DR `COGS` · CR `INVENTORY`. Invoice: DR `AR_CONTROL` (per partner,
INV-009) · CR revenue · CR `VAT_PAYABLE`. Receipt: DR cash/bank · CR `AR_CONTROL`; FX
difference at settlement → `FX_GAIN`/`FX_LOSS` (multi-currency). Credit note mirrors the
invoice and re-enters stock at **original issue cost**.

**Failure exits.** Credit block; threshold rejection with reason; period lock; partial
delivery allowed with open-balance tracking; corrections are always credit notes, never
edits (INV-003).

## 3. Procure-to-pay with three-way matching (PHASE-011)

**Entry conditions.** Supplier exists; PO issued; goods received into a warehouse;
matching tolerances configured (BR-009).

**States traversed.** Purchase request: DRAFT → APPROVED. Purchase order: DRAFT → ISSUED →
CLOSED. GRN: DRAFT → POSTED. Supplier invoice: DRAFT → (match outcome recorded) → APPROVED →
POSTED. Payment: DRAFT → POSTED with allocations.

```mermaid
flowchart TD
  PR[Purchase request APPROVED] --> PO[PO ISSUED]
  PO --> GRN[GRN POSTED<br/>stock + GRNI accrual]
  GRN --> SI[Supplier invoice DRAFT]
  SI --> M{Three-way match BR-009<br/>qty x price x terms}
  M -- "within tolerance" --> APP[Auto-approved path]
  M -- "price variance" --> V1[Exception: buyer review<br/>accept-with-reason or debit note]
  M -- "qty variance" --> V2[Exception: short/over receipt<br/>amend GRN or negotiate]
  M -- "no PO (direct buy)" --> V3[Standalone invoice path<br/>policy-gated]
  V1 --> APP
  V2 --> APP
  V3 --> APP
  APP --> POST[Supplier invoice POSTED<br/>DR expense/inventory · CR AP · clears GRNI]
  POST --> PAY[Payment + allocation INV-016]
  PAY --> END[End]
  V1 -- rejected --> DN[Debit note to supplier]
  POST -. FX at payment .-> FX[FX_GAIN / FX_LOSS posting]
```

**Postings.** GRN: DR `INVENTORY` · CR `GRNI`. Supplier invoice: DR `INVENTORY`/expense (+
`VAT_RECOVERABLE` where applicable) · CR `AP_CONTROL` · DR `GRNI` (clearing). Payment: DR
`AP_CONTROL` · CR bank; FX differences at settlement. Landed costs (PHASE-015 full flow)
revalue layers by value/quantity allocation before issues where possible.

**Failure exits.** Match exception without disposition → approval blocked (the match outcome
is recorded **before** approval, per lifecycle §3); duplicate supplier invoice number →
warning per BR-011; period lock; supplier credit-term breach is reported, not enforced.

## 4. Inventory count (PHASE-010)

**Entry conditions.** Warehouse active; count policy set (blind, threshold); counters
assigned. Detailed user pacing in [USER_JOURNEYS.md](USER_JOURNEYS.md) Journey D.

**States traversed.** Stock count: DRAFT → COUNTED → VARIANCE_REVIEW → POSTED.

```mermaid
flowchart TD
  S[Session DRAFT<br/>snapshot system qty] --> C[Count entry<br/>tablet/POS-lite offline]
  C --> V[VARIANCE_REVIEW<br/>variance = counted - system]
  V --> T{Above threshold BR-015?}
  T -- yes --> RC[Recount or second counter]
  RC --> V
  T -- no --> A{Approver approves}
  A -- yes --> ADJ[Adjustment POSTED<br/>shrinkage / appreciation journals]
  A -- no, corrected --> C
  ADJ --> R[Reports + reconciliation refresh]
  R --> E[End]
  ADJ -. locked period .-> X[Exit: INV-011 rejection]
  C -. unknown barcode .-> U[Quick-create draft path<br/>requires items.manage approval]
```

**Postings.** Loss: DR `INVENTORY_SHRINKAGE` · CR `INVENTORY`. Gain: DR `INVENTORY` · CR
`INVENTORY_APPRECIATION`. Expiry write-offs post identically with reason `EXPIRED`.

**Failure exits.** Locked period; batch-tracked line without batch assignment; movements
after snapshot are surfaced (never silently absorbed into variance).

## 5. Stock transfer (PHASE-010)

**Entry conditions.** Source and destination warehouses active; item stocked at source.

**States traversed.** Stock transfer: DRAFT → IN_TRANSIT → POSTED.

```mermaid
flowchart TD
  A[Transfer DRAFT<br/>from_wh -> to_wh] --> B[Dispatch: IN_TRANSIT<br/>leg 1 stock_move out]
  B --> C{Goods arrive}
  C -- confirmed --> D[POSTED<br/>leg 2 stock_move in]
  D --> E{Same valuation account?}
  E -- yes --> F[No journal<br/>stock_moves only]
  E -- no, branch-distinct accounts --> G[DR dest inventory · CR source inventory]
  C -- lost/damaged in transit --> H[Incident: count/adjustment at transit warehouse<br/>reason-coded shrinkage]
  B -. cancelled before dispatch .-> X[Cancel: no stock effect]
  H --> D
```

**Postings.** Same-account transfer: none (moves only, INV-018 documents the no-journal
policy case). Branch-distinct accounts: inventory-to-inventory journal. In-transit stock is
visible but **not sellable** (BR-016).

**Failure exits.** Cancel after dispatch impossible — the correction is the arrival
confirmation plus an adjustment; negative stock at source blocked by default (BR-013).

## 6. Production run (PHASE-018)

**Entry conditions.** BOM versioned and approved; materials available at the production
warehouse; WIP purpose mapped.

**States traversed.** Production order: DRAFT → RELEASED → IN_PROGRESS → COMPLETED (or
CANCELLED before consumption).

```mermaid
flowchart TD
  A[Production order DRAFT<br/>BOM x planned qty] --> R[RELEASED<br/>materials reserved]
  R --> C1[Material consumption batch 1<br/>DR WIP · CR INVENTORY]
  C1 --> IP[IN_PROGRESS]
  IP --> C2[Further consumptions<br/>+ recorded labor/service costs]
  C2 --> QC{QC inspection}
  QC -- pass --> FG[COMPLETED: FG receipt<br/>DR INVENTORY · CR WIP at production cost]
  QC -- fail --> SC[Scrap report<br/>DR shrinkage · CR WIP]
  SC --> FG
  FG --> G[Batch genealogy recorded<br/>consumed batch -> produced batch]
  G --> E[End]
  R -. cancelled before consumption .-> X[CANCELLED: no ledger effect]
  IP -. material shortage .-> S[Partial pause<br/>shortage reported to purchasing]
```

**Postings.** Consumption: DR `WIP` · CR `INVENTORY` at issue cost. Completion: DR
`INVENTORY` (finished goods) · CR `WIP` at accumulated production cost. Scrap: DR
`INVENTORY_SHRINKAGE` · CR `WIP`. WIP per order reconciles to the `WIP` account (INV-010).

**Failure exits.** Negative material issue blocked (BR-013); BOM change mid-run → new BOM
version applies to new orders only; QC failure without disposition blocks completion.

## 7. Van-sales settlement (PHASE-017)

**Entry conditions.** Van warehouse per rep; route loaded; settlement tolerance configured
(BR-021 family); rep has the `sales` role.

**States traversed.** Load transfer: POSTED (Journey G). Sales documents: normal lifecycles
(offline-capable). Settlement: DRAFT → POSTED.

```mermaid
flowchart TD
  L[Van load via stock transfer] --> V[Route visits<br/>invoices · receipts · returns]
  V --> SYNC{All synced?}
  SYNC -- no --> BLK[Block close<br/>name unsynced documents]
  BLK --> SYNC
  SYNC -- yes --> S[Settlement DRAFT<br/>system vs counted cash]
  S --> T{Variance within tolerance?}
  T -- no --> ESC[Escalation to accountant<br/>reason required]
  ESC --> P
  T -- yes --> P[Settlement POSTED<br/>cash deposit transfer + difference posting]
  P --> C[Van recount optional<br/>discrepancy -> variance line or count]
  P --> D[End: rep accountability closed]
```

**Postings.** Document-level postings occurred at sync (invoice/receipt/credit note per
workflows 1–2). Settlement: cash transfer from rep accountability to main cash/bank
(DR cash/bank · CR rep cash account); variance → cash-difference accounts with the
settlement as source document.

**Failure exits.** Unsynced documents block close; cash variance above tolerance requires
accountant disposition; offline credit breach surfaces as actionable sync errors (BR-001).

## 8. Service contract billing (PHASE-019)

**Entry conditions.** Contract active with billing schedule; customer exists; revenue
purpose mapped.

**States traversed.** Service contract: DRAFT → ACTIVE → (SUSPENDED) → EXPIRED/CANCELLED.
Generated invoices: DRAFT → APPROVED → POSTED (normal invoice lifecycle).

```mermaid
flowchart TD
  A[Contract DRAFT<br/>terms + billing schedule] --> B[ACTIVE]
  B --> J{Billing due date}
  J -- monthly/quarterly/annual --> G[Job generates invoice DRAFT<br/>recurring contract source]
  G --> APP{Approval policy BR-010/034}
  APP -- auto within threshold --> P[Invoice POSTED<br/>DR AR · CR revenue · CR VAT]
  APP -- above threshold --> H[Approver queue]
  H -- approved --> P
  H -- rejected --> R[Return to draft with reason]
  R --> G
  P --> N[Next cycle scheduled]
  B -- usage-based lines --> U[Service orders feed usage lines<br/>into next invoice draft]
  B -- cancelled --> C[CANCELLED: no further drafts<br/>posted history intact]
```

**Postings.** Identical to a sales invoice (DR `AR_CONTROL` · CR revenue · CR `VAT_PAYABLE`)
with the contract as source reference; service orders consume parts (DR service COGS · CR
`INVENTORY`) and record labor lines to cost centers/projects.

**Failure exits.** Contract suspension stops generation (explicit, audited); customer credit
policy still applies to generated invoices; period lock rejects the generated draft's
posting like any other (INV-011).

## 9. Bank reconciliation (PHASE-008)

**Entry conditions.** Bank account configured; statement file available in a supported
per-bank format.

**States traversed.** Bank statement: IMPORTED → RECONCILING → RECONCILED (locks the
statement period for that account).

```mermaid
flowchart TD
  A[Import statement CSV/XLSX<br/>per-bank adapter] --> B[Auto-match pass<br/>amount + date window + reference]
  B --> C{Manual remainder}
  C -- match --> D[Mark matched pairs]
  C -- bank charges --> E[Charge record<br/>posts bank-charge expense]
  C -- timing difference --> F[Leave unmatched<br/>aged list]
  D --> G{All system items explained?}
  E --> G
  F --> G
  G -- yes --> H[RECONCILED<br/>statement period locked for account]
  G -- no --> I[Open recon continues<br/>surfaced in close checklist C4]
  H --> J[End]
```

**Postings.** Bank charges: DR bank-charge expense · CR bank account. Corrections for
unrecorded movements discovered during matching are new treasury documents — the
reconciliation itself never edits movements (INV-019 internal consistency).

**Failure exits.** Import format failure (row-level errors listed, partial import rejected
as a unit); duplicate statement period import blocked; reconciliation cannot silently
absorb amounts — unmatched items stay honest and aged.

## Workflow ↔ module ownership

| Workflow | Owning modules ([../architecture/MODULE_BOUNDARIES.md](../architecture/MODULE_BOUNDARIES.md)) | Phase |
|---|---|---|
| O2C cash / credit | sales, partners, items, inventory, treasury, tax, accounting | 012 (POS 016) |
| P2P + matching | purchasing, inventory, partners, treasury, tax, accounting | 011 |
| Inventory count | inventory, accounting | 010 |
| Stock transfer | inventory, accounting | 010 |
| Production run | manufacturing, inventory, accounting | 018 |
| Van-sales settlement | distribution, sales, treasury, inventory, sync (020) | 017 |
| Service contract billing | crm, sales, tax, accounting | 019 |
| Bank reconciliation | treasury, accounting | 008 |
