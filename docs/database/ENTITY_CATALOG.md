# Entity Catalog

> **Status:** STABLE · **Owner:** Database Architecture · **Updated:** 2026-10-28 — EXP-001 (+26 tables for giant parity, total ~110)

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
| `tenants` | Customer organizations | id, name, status (minimal stub — full profile 003) | 002 (minimal) → 003 (full) | no |
| `branches` | Operating units | tenant_id, code, name, name_ar, address, is_active | 004 | no |
| `users` | Global identity (email/phone unique) | email, phone, password_hash, status, locale, mfa fields | 003 | no |
| `memberships` | User↔tenant role link | user_id, tenant_id, role_id, branch_scope[], status | 003 | no |
| `roles` | Tenant roles | tenant_id (null = system template), key, name, name_ar, is_system | 003 | no |
| `permissions` | Atomic action catalog (seeded) | key (`sales.invoices.post`), module, description | 003 seed | no |
| `role_permissions` | Role grants | role_id, permission_id | 003 | no |
| `sessions` | Web sessions | user_id, token_hash, tenant_id (active), expires_at, revoked_at, ip, device_id | 003 | no |
| `devices` | Registered native clients | user_id, device_key_hash, platform, name, last_seen_at, revoked_at | 003 (schema) / 020 (sync) | no |
| `mfa_factors` | TOTP enrollment | user_id, secret_enc, enrolled_at, last_used_at, recovery_codes_hash | 003 | no |
| `invitations` | Membership invitations | email, tenant_id, role_id, token_hash, expires_at, accepted_at | 004 | no |
| `plans` | Subscription plans (seeded + admin) | key, name, price, limits jsonb, feature_keys[] | 004 | no |
| `subscriptions` | Tenant plan assignment | tenant_id, plan_id, status, period, provider_ref | 014 | no |
| `entitlements` | Effective feature grants (materialized) | tenant_id, feature_key, source, expires_at | 004 | no |
| `tenant_settings` | Key-value config (typed) | tenant_id, key, value jsonb | 004 | no |
| `audit_events` 🔒 | Immutable audit trail | tenant_id, actor_id, action, entity_type, entity_id, before/after jsonb, correlation_id (append-only, RLS) | 002 (infra) → 003 (exposure) | no |

## accounting (PHASE-007)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `accounts` | CoA nodes | tenant_id, code, name, name_ar, type, parent_id, is_postable, currency, status | 007 | no |
| `account_purposes` | Purpose→account mapping | tenant_id, purpose_key, account_id, active_from | 007 | no |
| `fiscal_years` | Tenant years | tenant_id, start_date, end_date, status | 007 | no |
| `fiscal_periods` | Month periods | fiscal_year_id, start_date, end_date, status (OPEN/SOFT_CLOSED/LOCKED) | 007 | no |
| `currencies` *(seed)* | ISO currencies + minor units | code, name, name_ar, minor_units | seed | no |
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
| `tenant_industry_config` | Applied template state | tenant_id, template_key, applied_manifest_hash, applied_at, overrides jsonb | 015 | no |
| `feature_flags` | Rollout flags | key, scope, enabled, rules jsonb | 015 | no |

## fixed assets (PHASE-026)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `fixed_assets` | Asset register | tenant_id, asset_no, category_id, name, name_ar, serial_no, acquisition_date, acquisition_cost, useful_life_months, depreciation_method (straight_line/declining/units), salvage_value, location, custodian_id, status (active/disposed/sold) | 026 | no |
| `asset_categories` | Asset taxonomy | tenant_id, code, name, name_ar, parent_id, default_useful_life, default_method, account_depreciation_id, account_accum_id | 026 | no |
| `asset_depreciation_schedules` | Planned depreciation | asset_id, period_no, period_date, amount, posted_journal_id | 026 | no |
| `asset_movements` | Transfers/disposals/revaluations | asset_id, type (transfer/disposal/revaluation), from_cost_center, to_cost_center, amount, journal_id | 026 | no |

## workforce — HR & payroll (PHASE-027/028)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `employees` | Workforce master | tenant_id, code, name, name_ar, national_id, phone, email, hire_date, department_id, grade_id, bank_account, status | 027 | no |
| `departments` | Org units | tenant_id, code, name, name_ar, parent_id | 027 | no |
| `payroll_elements` | Earnings/deductions | tenant_id, code, name, name_ar, kind (earning/deduction), taxable, gosi_applicable | 027 | no |
| `payroll_runs` | Payroll periods | tenant_id, period_month, status (draft/approved/posted), total_gross, total_deductions, total_net, journal_id | 027 | no |
| `payroll_lines` | Per-employee breakdown | payroll_run_id, employee_id, element_id, amount, base_amount | 027 | no |
| `attendance_records` | Daily attendance | tenant_id, employee_id, date, check_in, check_out, status | 028 | no |
| `leave_requests` | Leave workflow | tenant_id, employee_id, type (annual/sick/etc), from_date, to_date, days, status | 028 | no |
| `gratuity_accruals` | EOS provision | tenant_id, employee_id, as_of, accrued_amount, journal_id | 028 | no |

## wholesale & electronics (PHASE-029/030)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `wholesale_tiers` | Volume/price tiers | tenant_id, partner_id or tier_code, item_id, min_qty, unit_price, discount_percent | 029 | no |
| `warranty_contracts` | Device warranties | tenant_id, serial_id, customer_id, start_date, end_date, terms, status | 030 | no |
| `repair_tickets` | Service workshop | tenant_id, ticket_no, customer_id, item_id, serial_id, issue_desc, status (open/in_progress/closed), parts_used, labor_cost | 030 | no |
| `rma_claims` | Returns to supplier | tenant_id, supplier_id, item_id, serial_id, reason, status | 030 | no |

## healthcare — HIS lite (PHASE-031)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `patients` | Patient registry | tenant_id, code, name, name_ar, national_id, dob, gender, phone, insurance_no | 031 | no |
| `appointments` | Scheduling | tenant_id, patient_id, doctor_id (employee), clinic_room, appointment_time, status | 031 | no |
| `encounters` | Visits/admissions | tenant_id, patient_id, appointment_id, type (visit/admission), diagnosis, billing_status | 031 | no |
| `medical_invoices` | Healthcare billing | tenant_id, patient_id, encounter_id, invoice_id (FK sales_invoices), insurance_share | 031 | no |

## education — SIS lite (PHASE-032)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `students` | Student registry | tenant_id, code, name, name_ar, dob, guardian_id, status | 032 | no |
| `classes` | Academic classes | tenant_id, academic_year, code, name, name_ar, homeroom_teacher_id | 032 | no |
| `enrollments` | Student-class link | student_id, class_id, academic_year, status | 032 | no |
| `fee_structures` | Fee schedules | tenant_id, academic_year, class_id, fee_type, amount, due_date | 032 | no |
| `fee_invoices` | Fee billing | tenant_id, student_id, fee_structure_id, invoice_id, amount, status | 032 | no |

## agriculture & livestock (PHASE-033)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `farms` | Farm registry | tenant_id, code, name, location, area_hectares | 033 | no |
| `crop_seasons` | Planting cycles | tenant_id, farm_id, crop_name, season_start, season_end, status | 033 | no |
| `crop_inputs` | Inputs (seed/fertilizer) | crop_season_id, item_id, qty, cost | 033 | no |
| `harvests` | Harvest yields | crop_season_id, harvest_date, qty, grade, warehouse_id | 033 | no |
| `livestock` | Animal registry | tenant_id, tag_no, species, breed, birth_date, status | 033 | no |
| `livestock_feedings` | Feed log | livestock_id, feed_item_id, qty, date | 033 | no |

## group consolidation (PHASE-034)

| Entity | Purpose | Key fields | Phase | OC |
|--------|---------|-----------|-------|----|
| `entity_groups` | Legal groups | tenant_group_id, name, name_ar, parent_group_id | 034 | no |
| `intercompany_transactions` | IC docs | group_id, from_tenant_id, to_tenant_id, doc_type, amount, elimination_status | 034 | no |
| `elimination_entries` | Consolidation journals | group_id, fiscal_period_id, journal_id, eliminated_entity_id | 034 | no |

## Diagrams


ER diagrams per domain cluster: [ERD/](ERD/) — tenancy-identity, accounting-core,
trade-inventory, treasury-tax. Generated/refreshed per phase (README sync rule).
