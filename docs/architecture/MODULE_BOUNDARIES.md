# Module Boundaries

> **Status:** STABLE · **Owner:** Platform Architecture · **Updated:** 2026-10-27

The authoritative module (bounded context) catalog. Modules live in `apps/api/src/modules/`
as NestJS modules with a strict internal layout (`api/` = published surface,
`application/`, `domain/`, `infrastructure/`). Enforcement is described in
[DEPENDENCY_RULES.md](DEPENDENCY_RULES.md); the shared-kernel contents in ADR-0002.

## Module catalog

| Module | Bounded context | Owns (tables, exclusively) | Publishes (services consumed by other modules) | Phase |
|--------|-----------------|---------------------------|------------------------------------------------|-------|
| `shared-kernel` (package) | Cross-cutting primitives | — | ids (UUIDv7), Money/Quantity/Rate, Result, Clock, localization keys | P-001 |
| `identity` | Users, authentication, sessions, devices, MFA | users, memberships, sessions, devices, mfa_factors, recovery | authenticate, session ctx, user lookup, permission checks | P-003 |
| `tenancy` | Tenants, branches, settings, entitlements | tenants, branches, tenant_settings, plans, subscriptions, entitlements | tenant ctx, resolveEntitlements, branch registry | P-003/004 |
| `accounting` | CoA, periods, currencies, journals, **posting engine**, GL, FX, closing | accounts, account_purposes, fiscal_years, fiscal_periods, currencies, exchange_rates, journal_entries, journal_lines, cost_centers | PostingEngine.post/reverse, CoA queries, period checks, GL queries | P-007 |
| `partners` | Customers/suppliers, credit terms, statements, subledger | partners, partner_contacts, partner_addresses, credit_terms, partner_balances | partner lookup, credit check, subledger queries | P-006 |
| `items` | Item master, categories, UoM, barcodes, price lists | items, item_categories, uoms, uom_conversions, barcodes, price_lists, price_list_items | item/UoM/pricing resolution | P-006 |
| `inventory` | Warehouses, stock ledger, valuation, batches/serials, counts, transfers | warehouses, stock_moves, stock_layers, item_warehouse_settings, stock_counts, stock_transfers, item_batches, item_serials | reserve/issue/receive stock, valuation queries, availability | P-010 |
| `sales` | Quotes, orders, deliveries, invoices, credit notes, AR docs, reps, POS docs | quotations, sales_orders, delivery_notes, sales_invoices, credit_notes, receipts, sales_reps, commissions | invoice/credit-note services, AR queries (with partners) | P-012/017 |
| `purchasing` | PR, PO, GRN, supplier invoices, debit notes, payments | purchase_requests, purchase_orders, goods_receipts, supplier_invoices, debit_notes, payments | AP queries, matching services | P-011 |
| `treasury` | Cash/bank accounts, expenses, petty cash, transfers, shifts, bank rec | cash_accounts, bank_accounts, expenses, cash_transfers, cashier_shifts, bank_reconciliations | money-movement services, account balances | P-008 |
| `tax` | Treatments, tax codes, jurisdiction packs, registrations, returns, e-invoicing adapters | tax_treatments, tax_codes, tax_rates, tax_registrations, jurisdictions, e_invoicing_submissions | resolveTax(lines), tax summaries, VAT return data | P-009 |
| `reporting` | Report contract registry, rendering, exports, print templates | reports (registry), report_runs, print_templates | runReport, export, print | P-013 |
| `notifications` | In-app + email/SMS/push adapters | notifications, notification_preferences | notify(user, event) | P-003 (email) / P-015 |
| `files` | Attachments, exports storage | file_objects | signed URL issuance, upload validation | P-002 |
| `audit` | Immutable audit events | audit_events | recordEvent (used via decorator/interceptor) | P-003 |
| `configuration` | Industry templates, feature config resolution | industry_templates, tenant_industry_config, feature_flags | resolveEffectiveConfig(tenant) | P-004/015 |
| `crm` | Leads, tasks, activities, contracts, service orders | leads, tasks, activities, service_contracts, service_orders | — | P-019 |
| `manufacturing` | BOM, production orders, WIP, QC, costing | bills_of_materials, production_orders, production_consumptions, inspections | production costing services | P-018 |
| `distribution` | Routes, van stock, rep settlements | routes, route_visits, van_stock, rep_settlements | settlement services | P-017 |
| `sync` | Device registry, change feeds, sync endpoints, cursors, tombstones, dedupe | sync_devices (mirror of identity devices' sync state), change_log, tombstones, sync_cursors, inbox_commands | pull/push contracts, device registration | P-016 (POS subset) / P-020 (full) |

## Cross-module write matrix (normative)

Only these cross-module writes exist — everything else is a published-service call:

| Table(s) | Written exclusively by |
|----------|----------------------|
| `journal_entries`, `journal_lines` | `accounting` (posting engine) — nobody else, ever |
| `stock_moves`, `stock_layers` | `inventory` |
| `partners*`, `items*` | `partners`, `items` |
| `audit_events` | `audit` module interceptor (never direct inserts from modules) |
| `cash_accounts`/`bank_accounts` balances | `treasury` (through posting engine for GL effects) |

## In-process events (side effects, not the record)

| Event | Emitted by | Handled by |
|-------|-----------|------------|
| `invoice.posted` | sales | notifications, reporting (cache invalidation) |
| `invoice.overdue` | sales (job) | notifications |
| `stock.below_reorder` | inventory | notifications |
| `tenant.suspended` | tenancy | identity (sessions), sync (device push rejection) |
| `einvoice.submission.failed` | tax adapter | notifications |
| `sync.push.rejected` | sync | notifications |

## Rule of thumb for new modules

A new capability becomes a module only if it owns tables and has a distinct vocabulary;
otherwise it is a feature of an existing module. Industry-specific logic lives in
templates + configuration + (rarely) thin adapters — **not** in new modules that duplicate
core domains (directive §3: one accounting engine, industry extensions around it).
