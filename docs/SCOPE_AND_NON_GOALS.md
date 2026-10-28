# Scope and Non-Goals

> **Status:** STABLE · **Owner:** Product & Platform Architecture · **Updated:** 2026-10-28 — EXP-001 Giant Expansion

This document defines what the Platform will and will not do, per release tier. It exists to
prevent scope creep and to keep the first commercial release achievable. Anything not listed
as in-scope is out-of-scope until a decision record adds it.

## Release tiers

| Tier | Delivered by | Definition |
|------|--------------|------------|
| **Foundation** | PHASE-001…004 | Repo, database infra, identity/tenancy/audit, tenant provisioning, platform admin |
| **MVP (Minimum Viable Commercial Release)** | PHASE-001…014 | Sellable back-office SaaS: accounting, inventory, purchasing, sales, tax, reporting, subscriptions |
| **Industry expansion** | PHASE-015…019 | Industry templates, POS, automotive/distribution templates, manufacturing, CRM |
| **Multi-platform** | PHASE-020…022 | Offline sync foundation, desktop app, Android app |
| **Enterprise & integrations** | PHASE-023…025 | E-invoicing implementations, payment/e-commerce adapters, security hardening, GA readiness |
| **Financial Depth & Workforce** | PHASE-026…028 | Fixed assets, HR/payroll/GOSI, budgeting, cost accounting — full accounting cycle |
| **Universal Commerce & Specialized Verticals** | PHASE-029…033 | Wholesale/bulk, electronics/mobiles/warranty, healthcare, education, agriculture/livestock |
| **Giant Scale & Group** | PHASE-034 | Multi-entity consolidation, intercompany, advanced analytics, hyperscale — **ULTRA GA** |

## In scope — MVP (non-exhaustive summary)

Full detail in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) and
[../product/FEATURE_CATALOG.md](product/FEATURE_CATALOG.md).

- Multi-tenant SaaS with registration, onboarding, branches, subscriptions, entitlements.
- Double-entry accounting: chart of accounts (bilingual), fiscal periods, journal entries,
  approval workflow, posting engine, general ledger, opening balances, multi-currency.
- Treasury: cash/bank/petty cash, receipts and disbursements, expenses, bank reconciliation.
- Master data: customers/suppliers, items, UoM, barcodes, price lists.
- Inventory: multi-warehouse stock ledger, WAC/FIFO valuation, batches/expiry/serials/IMEI,
  counts, transfers.
- Purchasing: PR/PO/GRN/supplier invoices/debit notes/payments, three-way matching.
- Sales: quotation→order→delivery→invoice→credit note, receipts, credit limits, aging.
- Tax: treatment model, jurisdiction packs (all listed countries, including no-VAT),
  VAT return report, unregistered-business mode.
- Reporting: report contract, financial statements, operational reports, bilingual RTL
  printing, PDF/XLSX/CSV export.
- Arabic-first RTL UI + English LTR; web application.

## In scope — post-MVP tiers

- Industry template engine + retail, grocery, restaurant, automotive, distribution, food
  manufacturing, professional services, rental/logistics templates.
- Point of sale with offline sale queue.
- Manufacturing (BOM, production orders, costing, QC basics), CRM/service, van sales and
  settlements.
- General offline sync foundation, desktop application (Tauri), Android application.
- ZATCA e-invoicing implementation (only against verified official specifications),
  payment-provider adapters, e-commerce/shipping adapters.
- Security hardening, performance, DR readiness for GA.
- **Full accounting cycle (added 2026-10-28 — giant parity):** fixed assets register, multi-method depreciation, asset lifecycle, revaluation, budgeting/forecasting, advanced cost accounting, intercompany.
- **Workforce (added):** HR master, contracts, shifts/attendance, leave, payroll runs, GOSI/social insurance (SA/EG/YE), gratuity/EOS, loans/advances, posting to GL.
- **Universal commerce (added):** wholesale tiers/bulk pricing, electronics/mobiles serial/IMEI warranty & service workshop, repair tickets.
- **Specialized verticals (added):** healthcare (patients/appointments/billing/insurance — clinic/HIS lite), education (students/classes/enrollments/fees/timetable — SIS lite), agriculture/livestock (farms/crops/livestock/feed/harvest/yield).

These are now **in-scope** and have dedicated phases 026–034 (see MASTER_ROADMAP).

## Explicit non-goals (all tiers unless a decision record changes this)

1. **A public marketplace / third-party app ecosystem.** The extension mechanism is
   internal industry templates and jurisdiction packs, not a plugin marketplace.
2. **Blockchain, cryptocurrency, or tokenization features.**
3. **Country-specific legal accounting formats beyond the listed jurisdictions** (e.g.,
   statutory filing directly to governments) without a verified official integration.
4. **Microservices, event sourcing, or distributed databases** at launch
   ([ADR-0001](architecture/ADR/ADR-0001-modular-monolith.md)).
5. **Running on customer-owned infrastructure (on-premise)** at launch. The deployment
   architecture keeps this possible, but the commercial model is SaaS.
6. **Social/network features, AI copilots, and chat interfaces** — not part of the core
   platform promise; may be revisited post-GA.
7. **Supporting languages beyond Arabic and English in the MVP.** The i18n architecture
    supports adding languages; only AR and EN are produced and tested initially.
8. **Real-time financial consolidation across separate legal entities at GA-v1** — PHASE-034 delivers group/intercompany consolidation; before that, multi-branch only.

> **2026-10-28 Giant expansion — former non-goals now in-scope:** payroll/HR/GOSI (026–028), fixed assets/depreciation (026), hospitals/schools/agriculture (031–033), wholesale/electronics specialization (029–030), and consolidation (034) were moved from non-goals to staged delivery via decision record EXP-001. Sectors are implemented as industry templates + dedicated modules, not forks.

## Deliberate deferrals (with reasons and triggers)

| Deferred item | Reason | Must be completed by |
|---------------|--------|---------------------|
| Fixed assets & depreciation | Complex schedules; core posting engine required first | **PHASE-026** (now committed) |
| Scheduled reports & email digests | Depends on job scheduler maturity | PHASE-025 |
| Customer self-service portal | Requires hardened public auth surface | PHASE-023…025 |
| Hijri fiscal calendars | Fiscal years are Gregorian; Hijri display everywhere is MVP | If customers demand it (decision record) |
| Payment provider auto-reconciliation | Requires verified provider APIs | PHASE-024 |
| Multi-entity consolidation | Large surface — group/intercompany + eliminations | **PHASE-034** (now committed) |
| Payroll/HR/GOSI | Labor-law per country; needs verified specs | **PHASE-027–028** (now committed) |
| Healthcare/HIS lite | Domain-specific compliance | **PHASE-031** (now committed) |
| Education/SIS lite | Academic year domain | **PHASE-032** (now committed) |
| Agriculture/livestock | Season/crop/livestock domain | **PHASE-033** (now committed) |

## What "done" means for a tier

A tier is done only when every phase it contains meets its exit criteria with evidence, per
[../planning/PHASE_ACCEPTANCE_CRITERIA.md](planning/PHASE_ACCEPTANCE_CRITERIA.md) and the
completion-report requirements in
[../handoff/IMPLEMENTATION_PROTOCOL.md](handoff/IMPLEMENTATION_PROTOCOL.md).
