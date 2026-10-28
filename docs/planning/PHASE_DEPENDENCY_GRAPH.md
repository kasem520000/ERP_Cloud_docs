# Phase Dependency Graph

> **Status:** STABLE · **Owner:** Platform Architecture · **Updated:** 2026-10-27

Full dependency graph with edge semantics. Nodes: `Pxxx` phases; edges: `A --> B` means
"B requires A complete with evidence". The graph is validated acyclic by the
cross-document validation script (see [../handoff/VALIDATION_REPORT.md](../handoff/VALIDATION_REPORT.md)).

```mermaid
flowchart TD
  P001["P001 Repo & Engineering Foundation"]
  P002["P002 Database & Migration Infrastructure"]
  P003["P003 Identity, Multi-Tenancy & Audit"]
  P004["P004 Provisioning & Platform Admin"]
  P005["P005 Design System, i18n & RTL"]
  P006["P006 Master Data"]
  P007["P007 Accounting Core & Posting Engine"]
  P008["P008 Treasury & Expenses"]
  P009["P009 Tax Engine & Jurisdiction Packs"]
  P010["P010 Inventory & Warehousing"]
  P011["P011 Purchasing & Payables"]
  P012["P012 Sales & Receivables"]
  P013["P013 Reporting, Statements & Printing"]
  P014["P014 Subscriptions, Billing & Onboarding (MVP)"]
  P015["P015 Industry Framework & Templates"]
  P016["P016 Point of Sale"]
  P017["P017 Automotive & Distribution Templates"]
  P018["P018 Manufacturing"]
  P019["P019 CRM, Service & Projects"]
  P020["P020 Offline Sync Foundation"]
  P021["P021 Desktop Application"]
  P022["P022 Android Application"]
  P023["P023 Integrations & E-Invoicing"]
  P024["P024 Security Hardening"]
  P025["P025 Performance & GA Readiness"]

  P001 --> P002 --> P003 --> P004
  P004 --> P005
  P005 --> P006
  P006 --> P007
  P007 --> P008
  P007 --> P009
  P008 --> P010
  P009 --> P010
  P010 --> P011
  P011 --> P012
  P012 --> P013
  P013 --> P014
  P014 --> P015
  P015 --> P016
  P016 --> P017
  P017 --> P018
  P017 --> P019
  P016 --> P020
  P020 --> P021
  P020 --> P022
  P020 --> P023
  P023 --> P024
  P024 --> P025

  classDef foundation fill:#dbeafe,stroke:#1e40af
  classDef mvp fill:#dcfce7,stroke:#166534
  classDef industry fill:#fef3c7,stroke:#92400e
  classDef offline fill:#fce7f3,stroke:#9d174d
  classDef enterprise fill:#ede9fe,stroke:#5b21b6
  class P001,P002,P003,P004,P005 foundation
  class P006,P007,P008,P009,P010,P011,P012,P013,P014 mvp
  class P015,P016,P017,P018,P019 industry
  class P020,P021,P022 offline
  class P023,P024,P025 enterprise
```

## Edge semantics table

| Edge | Why B requires A |
|------|------------------|
| 001→002 | Migrations/conventions need repo, CI, tooling |
| 002→003 | Identity tables need migration framework + RLS helpers |
| 003→004 | Provisioning needs tenants/users/permissions/audit |
| 004→005 | App shell needs entitlement-driven navigation data model |
| 005→006 | Master data screens need design system + i18n |
| 006→007 | CoA/opening balances reference partners/items; account purposes need master data |
| 007→008 | Treasury posts through the posting engine |
| 007→009 | Tax engine posts VAT to GL accounts; document lifecycle defined |
| 008,009→010 | Opening stock posts through inventory accounting; stock moves carry tax context where applicable |
| 010→011 | GRN issues stock into warehouses |
| 011→012 | Sales reuses matching/payment/allocation patterns + AP/AR symmetry; invoice chain consumes items/inventory/tax |
| 012→013 | Statements/reports reconcile against real transactional data |
| 013→014 | Billing needs export/print + report contract for invoices/statements |
| 014→015 | Industry framework needs entitlements + configuration baseline |
| 015→016 | POS is delivered as an industry-driven configuration + POS module |
| 016→017 | Templates build on POS + sales flows; van sales consume POS/device patterns |
| 017→018 | Manufacturing template rides the industry framework maturity |
| 017→019 | CRM consumes partner/contract patterns stabilized by 017 |
| 016→020 | POS offline queue is the first concrete consumer to generalize |
| 020→021, 020→022 | Clients consume the sync protocol |
| 020→023 | External integrations ride device/adapter + job patterns |
| 023→024 | Hardening includes integration surface |
| 024→025 | GA readiness is final |

## Parallelism notes (for planning, not for agents)

- P008 ∥ P009 may run in parallel (both depend on P007 only).
- P018 ∥ P019 may run in parallel (both depend on P017).
- P021 ∥ P022 may run in parallel (both depend on P020).
- **However**: implementing agents execute one phase at a time to keep verification
  rigorous; parallelism is an option for human teams, not the default agent protocol.

## Change propagation

If a phase's scope changes after subsequent phases are complete: the phase document
lists "affected downstream phases" — re-run their review checklist
([../handoff/IMPLEMENTATION_PROTOCOL.md](../handoff/IMPLEMENTATION_PROTOCOL.md) §6).
Foundational phases (001–005) changes require full-roadmap review.
