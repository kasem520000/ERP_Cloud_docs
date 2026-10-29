# Entity Catalog

> **Status:** STABLE · **Owner:** Database Architecture · **Updated:** 2026-10-28

All planned entities grouped by owning module, with the phase that introduces them and
key relationships. This is the catalog-level map; column-level specifications for core
tables live in [TABLES/](TABLES/) and grow per phase (the actual Drizzle schema is the
machine-readable mirror — README sync rule). Column detail is deliberately **not**
speculative: entities introduced in later phases are listed with their key fields only,
and their TABLES specs are completed in their phase (directive §23 STEP 4).

Legend: **Phase** = first implementation phase · **OC** = offline-creatable
(UUIDv7 client-side, ADR-0006) · 🔒 = append-only (no update/delete by app role).

## tenancy & identity (PHASE-002/003/004)

| Entity | Purpose | Key fields / relationships | Phase | OC |
|--------|---------|---------------------------|-------|----|
| `tenants` | Customer organizations | name, name_ar, status, base_currency, country_code, timezone, industry_template_key, deleted_at | 002 (minimal) → 004 (profile) | no |
| `branches` | Operating units | tenant_id, code, name, name_ar, address, is_active | 004 | no |
| `users` | Global identity (email/phone unique) | email, phone, password_hash, status, locale, mfa fields | 003 | no |
| `memberships` | User↔tenant role link | user_id, tenant_id, role_id, branch_scope[], status | 003 | no |
| `roles` | Tenant roles | tenant_id (null = system template), key, name, name_ar, is_system | 003 | no |
| `permissions` | Atomic action catalog (seeded) | key (`sales.invoices.post`), module, description | 003 seed | no |
| `role_permissions` | Role grants | role_id, permission_id | 003 | no |
| `sessions` | Web sessions | user_id, token_hash, tenant_id (active), expires_at, revoked_at, ip, device_id | 003 | no |
| `devices` | Registered native clients | user_id, device_key_hash, platform, name, last_seen_at, revoked_at | 003 (schema) / 020 (sync) | no |
| `mfa_factors` | TOTP enrollment | user_id, secret_enc, enrolled_at, last_used_at, recovery_codes_hash | 003 | no |
| `invitations` | Membership invitations | email, tenant_id, role_id, token_hash, expires_at, accepted_at | 003 | no |
| `plans` | Subscription plans (seeded + admin) | key, name, price, limits jsonb, feature_keys[] | 004 | no |
| `subscriptions` | Tenant plan assignment | tenant_id, plan_id, status, period, provider_ref | 014 | no |
| `entitlements` | Effective feature grants (materialized) | tenant_id, feature_key, source, expires_at | 004 | no |
| `tenant_settings` | Key-value config (typed) | tenant_id, key, value jsonb | 004 | no |
| `support_sessions` | Time-boxed audited support access (matrix §7) | tenant_id, platform_user_id, opt_in, ticket_ref, reason, opened_at, expires_at, closed_at, closed_by, status | 004 | no |
| `audit_events` 🔒 | Immutable audit trail | tenant_id (null = platform-scope row, 004), actor_id, action, entity_type, entity_id, before jsonb, after jsonb, correlation_id, device_id, via_platform_admin (004), at | 002 → 004 (platform scope) | no |
| `_schema_state` | Migration-state mirror in the `erp` schema (`erp.schema_version()` feeds `/health/ready`); infra, not a domain entity | key, value, at | 002 | no |

## accounting (PHASE-007)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `accounts` | CoA nodes | tenant_id, code, name, name_ar, type, parent_id, is_postable, currency, status | 004 (schema+template) / 007 (posting) | no |
| `account_purposes` | Purpose→account mapping | tenant_id, purpose_key, account_id, active_from | 004 (schema+template) / 007 (posting) | no |
| `fiscal_years` | Tenant years | tenant_id, start_date, end_date, status | 007 | no |
| `fiscal_periods` | Month periods | fiscal_year_id, start_date, end_date, status (OPEN/SOFT_CLOSED/LOCKED) | 007 | no |
| `currencies` *(seed)* | ISO currencies + minor units | code, name, name_ar, minor_units | 002 (planned) → 004 (delivered) | no |
| `countries` *(seed)* | ISO-3166 country records + display defaults (locale, currency, date format, timezone) | code, name, name_ar, default_locale, currency_code, date_format, time_zone | 002 (planned) → 004 (delivered) | no |
| `exchange_rates` | Dated rates | tenant_id, currency_code, rate_date, rate, source | 007 | no |
| `journal_entries` 🔒 | Posted entries | tenant_id, entry_no, entry_date, fiscal_period_id, currency, exchange_rate, status (POSTED/REVERSED), source_type, source_id, operation, reversal_of_id, reversed_by_id, description, posted_at/by | 007 | no |
| `journal_lines` 🔒 | Entry lines | journal_entry_id, line_no, account_id, direction, amount, base_amount, partner_id, item_id, cost_center_id, tax_code_id, memo | 007 | no |
| `cost_centers` | Analytical dimension | tenant_id, code, name, name_ar, parent_id | 007 (basic) | no |
| `recurring_journals` | Recurrence definitions | tenant_id, template jsonb, schedule, next_run_date, status | 007 | no |
| `approval_policies` | Doc-type approval rules | tenant_id, doc_type, policy jsonb (thresholds, approvers) | 007 | no |

## partners & items (PHASE-006)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `partners` | Customers/suppliers/both | tenant_id, kind, code, name, name_ar, tax_number, credit_limit, credit_terms_id, price_list_id, balance caches (read-model), status | 006 | no |
| `partner_contacts` | Contact people | partner_id, name, phone, email, role | 006 | no |
| `partner_addresses` | Addresses | partner_id, type, line1, city, country_code, geo | 006 | no |
| `credit_terms` | Payment terms | tenant_id, code, days, description | 006 | no |
| `opening_balance_docs` | Draft opening balances | tenant_id, kind (partner/account/stock), target refs, amounts, status | 006 (draft) / 007 (posting) | no |
| `item_categories` | Item taxonomy | tenant_id, code, name, name_ar, parent_id | 006 | no |
| `items` | Item master | tenant_id, sku, barcode_ref, name, name_ar, kind (stock/service/composite), uom_id, category_id, tax_code_id, costing_method, track_batch, track_serial, track_imei, has_expiry, reorder defaults, status | 006 | no |
| `uoms` | Units of measure | tenant_id, code, name, name_ar | 006 | no |
| `uom_conversions` | Conversion factors | tenant_id, from_uom, to_uom, factor | 006 | no |
| `barcodes` | Item barcodes | tenant_id, item_id, code, uom_id | 006 | no |
| `price_lists` | Price lists | tenant_id, name, currency, kind (sale/purchase), validity | 006 | no |
| `price_list_items` | Prices | price_list_id, item_id, uom_id, unit_price, min_qty | 006 | no |
| `file_objects` | Attachments | tenant_id, owner_type, owner_id, storage_key, name, size, content_type, checksum, uploaded_by | 002 (infra) / 006 (usage) | no |

## inventory (PHASE-010)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `warehouses` | Stock locations | tenant_id, branch_id, code, name, name_ar, is_active | 010 | no |
| `item_warehouse_settings` | Per-item defaults | item_id, warehouse_id, reorder_level, min_qty | 010 | no |
| `stock_moves` 🔒 | Immutable movements | tenant_id, item_id, warehouse_id, direction (IN/OUT), qty, unit_cost, batch_id, serial_id, move_kind (receipt/issue/transfer_in/transfer_out/adjust), source_type, source_id, moved_at, value_amount | 010 | POS only |
| `stock_layers` | FIFO cost layers | tenant_id, item_id, warehouse_id, remaining_qty, unit_cost, source_move_id | 010 | no |
| `item_stock` | Read model: qty on hand | item_id, warehouse_id, qty, avg_cost | 010 | no |
| `item_batches` | Batch/lot records | tenant_id, item_id, batch_no, expiry_date, source_ref | 010 | no |
| `item_serials` | Serial/IMEI units | tenant_id, item_id, serial_no, imei, status (in_stock/sold/returned), current_owner | 010 | no |
| `stock_counts` | Count sessions | tenant_id, warehouse_id, status, counted_by, variance jsonb | 010 | no |
| `stock_count_lines` | Counted lines | stock_count_id, item_id, batch_id, system_qty, counted_qty | 010 | POS-lite |
| `stock_transfers` | Warehouse transfers | tenant_id, from_wh, to_wh, status (DRAFT/IN_TRANSIT/POSTED), lines | 010 | no |

## purchasing (PHASE-011)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `purchase_requests` | Internal requisitions | tenant_id, branch_id, requested_by, lines, status | 011 | no |
| `purchase_orders` | Supplier orders | tenant_id, supplier_id, branch_id, order_no, order_date, expected_date, status, lines, totals, tax_summary | 011 | no |
| `goods_receipts` | Goods-in docs | tenant_id, po_id, warehouse_id, receipt_no, status, lines (item, qty, batch) | 011 | no |
| `supplier_invoices` | AP invoices | tenant_id, supplier_id, invoice_no (supplier's), internal_no, match_result, status, totals, tax_summary, due_date | 011 | no |
| `debit_notes` | AP corrections | tenant_id, supplier_id, ref invoice, amounts | 011 | no |
| `payments` | Money out | tenant_id, supplier_id (or payee), cash_account_id, amount, allocations, status | 008 (generic disbursement) / 011 (AP alloc) | no |
| `landed_costs` | Cost allocations | tenant_id, grn_id, cost_type, amount, allocation (value/qty), lines | 011 | no |

## sales (PHASE-012; POS 016; distribution 017)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `quotations` | Offers | tenant_id, customer_id, valid_until, status, lines, totals | 012 | no |
| `sales_orders` | Confirmed orders | tenant_id, customer_id, branch_id, order_no, status, lines, reservations | 012 | no |
| `delivery_notes` | Goods-out docs | tenant_id, order_id, warehouse_id, status, lines | 012 | no |
| `sales_invoices` | Billing docs | tenant_id, customer_id, branch_id, invoice_no, invoice_date, due_date, kind (CASH/CREDIT), currency, exchange_rate, totals, tax_summary, posted_journal_ids, status, offline_receipt_no?, einvoice_status | 012 | POS yes |
| `sales_invoice_lines` | Lines | invoice_id, item_id, qty, uom_id, unit_price, discount, tax_code_id, tax_snapshot, net_amount, tax_amount, batch_id, serial_id | 012 | POS yes |
| `credit_notes` | AR corrections/returns | tenant_id, customer_id, ref_invoice_id, lines, totals, tax_summary, return_stock | 012 | no |
| `receipts` | Money in | tenant_id, customer_id, cash_account_id, amount, currency, exchange_rate, allocations, status, method | 008 (generic) / 012 (AR alloc) | POS yes |
| `sales_reps` | Representatives | tenant_id, user_id, code, commission_rate | 012 (attr) | no |
| `pos_terminals` | Registered terminals | tenant_id, branch_id, code, name, device_id, status | 016 | no |
| `pos_sales` | POS sessions/shifts | terminal_id, cashier_id, opening_float, counted, variance, status | 016 | no |
| `routes` | Distribution routes | tenant_id, rep_id, day pattern, customers[] | 017 | no |
| `van_stocks` | Vehicle stock ledger | tenant_id, rep_id, item_id, qty (mirror of stock_moves scoped to van warehouse) | 017 | no |
| `rep_settlements` | Rep day settlements | tenant_id, rep_id, route_visit refs, cash collected, invoices, returns, variance, status | 017 | no |

## treasury (PHASE-008)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `cash_accounts` | Cash/bank/petty accounts (linked to GL) | tenant_id, type (CASH/BANK/PETTY), account_id (CoA), branch_id?, currency, status | 008 | no |
| `cash_movements` | Money in/out records | tenant_id, cash_account_id, direction, amount, source_type, source_id, value_date | 008 | no |
| `expenses` | Expense claims/records | tenant_id, category_id, payee, amount, tax, cash_account_id, status, receipts (file refs) | 008 | no |
| `expense_categories` | Categories | tenant_id, code, name, name_ar, account_id, approval_policy | 008 | no |
| `cash_transfers` | Account↔account transfers | tenant_id, from_id, to_id, amount, charges, status | 008 | no |
| `cashier_shifts` | POS/teller shifts | tenant_id, cash_account_id, user_id, opening, counted, difference, status | 008 | no |
| `bank_statements` | Imported statements | tenant_id, bank_account_id, period, source file ref | 008 | no |
| `bank_statement_lines` | Statement lines | statement_id, date, amount, ref, matched_movement_id? | 008 | no |

## tax & compliance (PHASE-009/023)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `jurisdictions` *(seed)* | Country pack registry | country_code, name, vat_status, pack_version, effective dates | 009 seed | no |
| `jurisdiction_tax_rates` *(seed)* | Versioned rates | jurisdiction_id, treatment, rate, effective_from/to, source_ref, verified_at | 009 seed | no |
| `tax_treatments` *(seed)* | Treatment catalog | key, description, gl_effect | 009 seed | no |
| `tax_registrations` | Tenant registration status | tenant_id, jurisdiction_id, registration_no, status, effective_from | 009 | no |
| `tax_codes` | Tenant codes | tenant_id, jurisdiction_id, code, name, name_ar, treatment, default_rate snapshot policy | 009 | no |
| `e_invoicing_submissions` | Submission registry | tenant_id, doc_type, doc_id, adapter_id, status, attempts, authority_refs, payload_file, response_file | 023 (schema 009) | no |

## reporting & platform jobs (PHASE-002/013)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `report_runs` | Execution records | tenant_id, report_key, params jsonb, status, output_file, requested_by, duration | 013 | no |
| `print_templates` | Versioned templates | tenant_id?, key (A4/report/receipt80/receipt58), locale variants, version | 013 | no |
| `change_log` | Sync change feed | tenant_id, entity_type, entity_id, op, changed_at, seq | 020 | no |
| `tombstones` | Soft-delete markers for sync | tenant_id, entity_type, entity_id, deleted_at | 020 | no |
| `sync_cursors` | Per-device pull positions | device_id, entity_type, last_seq | 020 | no |
| `inbox_commands` | Processed sync commands (dedupe) | tenant_id, device_id, command_id, processed_at | 020 | no |

## industry configuration (PHASE-004/015)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `industry_templates` *(seed)* | Template manifests | key, name, name_ar, manifest jsonb (modules, menus, terminology, defaults), version | 004 seed / 015 engine | no |
| `chart_of_accounts_template` *(seed)* | Bilingual default CoA (CHART_OF_ACCOUNTS §3) with purpose markers | code, name, name_ar, type, is_group, parent_code, purpose_key | 004 seed (instantiation) / 007 (posting readiness) | no |
| `tenant_industry_config` | Applied template state | tenant_id, template_key, applied_manifest_hash, applied_at, overrides jsonb | 015 | no |
| `feature_flags` | Rollout flags | key, scope, enabled, rules jsonb | 015 | no |

> **Blueprint v2.0 module sections (ED-19).** The six financial-depth module sections
> below are specified at **blueprint level** per
> [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §C — 23 entities, all tenant-owned
> with RLS and UUIDv7 ids per the catalog conventions, phases PLANNED (delivered by
> PHASE-026…029/034); their TABLES specs are completed in their phase. Money, quantity,
> and rate types follow [ADR-0009](../architecture/ADR/ADR-0009-money-precision.md) and
> [DATA_DICTIONARY.md](DATA_DICTIONARY.md) §6 (costs/proceeds 19,4; percentages 7,4);
> append-only 🔒 tables follow INV-003 (no update/delete grants). The manufacturing and
> crm sections, by contrast, remain **phase-added** by PHASE-018/019 per the
> grow-per-phase rule — their entities enter this catalog when those phases are
> specified, not before.

## fixed_assets (PHASE-026)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `asset_categories` | Category defaults & purpose mapping | code, name, name_ar, useful_life_months_default, depreciation_method_default, asset_purpose_key, accum_depreciation_purpose_key, expense_purpose_key | 026 | no |
| `assets` | Asset register | code, name, name_ar, category_id, acquisition_date, cost, salvage_value, useful_life_months, depreciation_method, branch_id, custodian_user_id, status | 026 | no |
| `depreciation_runs` | Monthly depreciation batches | fiscal_period_id, status DRAFT/POSTED, totals, journal_entry_id | 026 | no |
| `depreciation_lines` 🔒 | Per-asset run lines | run_id, asset_id, period_amount, accumulated_amount | 026 | no |
| `asset_disposals` | Sale/scrap disposals | asset_id, disposal_date, kind SALE/SCRAP, proceeds, net_book_value, gain_loss, status DRAFT/POSTED, journal_entry_id | 026 | no |
| `asset_revaluations` | Audited revaluations | asset_id, revaluation_date, new_gross_value, new_accumulated, delta, status, journal_entry_id | 026 | no |

## notes (PHASE-027)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `notes` | Cheques & promissory notes in custody | kind CHEQUE/PROMISSORY_NOTE, direction RECEIVED/ISSUED, partner_id, number, issuing_bank, amount, currency, exchange_rate, issue_date, maturity_date, status, source_type/source_id | 027 | no |
| `note_events` 🔒 | Custody/lifecycle events | note_id, event_kind, event_date, refs, journal_entry_id, created_by | 027 | no |

## installments (PHASE-027)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `installment_plans` | Payment plans over source documents | partner_id, source_type/source_id, total_amount, down_payment, count, start_date, frequency, late_fee_policy jsonb, status ACTIVE/CLOSED/DEFAULTED | 027 | no |
| `installment_lines` | Generated dues schedule | plan_id, seq, due_date, amount, status PENDING/DUE/PAID/OVERDUE/WAIVED, receipt_refs | 027 | no |

## budgeting (PHASE-028)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `budgets` | Versioned budgets by fiscal year & scope | fiscal_year_id, scope, name, version, status DRAFT/PENDING_APPROVAL/ACTIVE/REVISED/CLOSED, supersedes_id | 028 | no |
| `budget_lines` | Budget amounts per period/dimension | budget_id, fiscal_period_id, account_id, cost_center_id?, project_id?, branch_id?, amount | 028 | no |

## payroll (PHASE-029)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `employees` | Payroll employees (financial scope only) | code, name, name_ar, national_id, hire_date, termination_date?, contract_type, basic_salary, salary_structure_id, branch_id, cost_center_id?, bank fields, status | 029 | no |
| `salary_structures` | Salary component templates | name, name_ar, currency, status ACTIVE/ARCHIVED | 029 | no |
| `salary_components` | Structure lines | structure_id, key, name, name_ar, kind ALLOWANCE/DEDUCTION/EMPLOYER_CONTRIBUTION, calc FIXED/PERCENT_OF_BASIC/PERCENT_OF_GROSS, amount, rate, gl_account_id, is_eos_base | 029 | no |
| `payroll_runs` | Monthly payroll batches | fiscal_period_id, status DRAFT/PENDING_APPROVAL/POSTED, gross_total, deductions_total, net_total, journal_entry_id | 029 | no |
| `payroll_run_lines` 🔒 | Per-employee frozen pay lines | run_id, employee_id, component_snapshot jsonb, gross_total, deductions_total, net_total | 029 | no |
| `employee_loans` | Employee loans/advances | employee_id, amount, installments_count, start_period_id, status ACTIVE/CLOSED (WRITE_OFF) | 029 | no |
| `employee_loan_lines` | Per-period loan deductions | loan_id, fiscal_period_id, amount, payroll_run_id?, status PENDING/DEDUCTED/WAIVED | 029 | no |

## consolidation (PHASE-034)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `consolidation_groups` | Multi-entity group definitions (parent-owned) | owner_tenant_id, name, name_ar, base_currency, status | 034 | no |
| `group_entities` | Member entities & ownership | group_id, member_tenant_id, ownership_percent, include_from, status | 034 | no |
| `elimination_entries` | Intercompany eliminations | group_id, fiscal_period_id, description, status DRAFT/POSTED, journal_entry_ids | 034 | no |
| `consolidation_runs` | Consolidation execution records | group_id, fiscal_period_id, status QUEUED/RUNNING/COMPLETED/FAILED, output refs | 034 | no |

## Diagrams

ER diagrams per domain cluster: [ERD/](ERD/) — tenancy-identity, accounting-core,
trade-inventory, treasury-tax. Generated/refreshed per phase (README sync rule).
