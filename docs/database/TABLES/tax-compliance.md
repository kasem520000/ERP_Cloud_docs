# Table Specifications — Tax & Compliance

> **Status:** STABLE · **Owner:** Database & Tax Architecture · **Updated:** 2026-10-27

Column-level specifications for the tax/compliance tables introduced in PHASE-009
(registry schema) and completed in PHASE-023 (submission registry). Conventions:
[../DATABASE_CONVENTIONS.md](../DATABASE_CONVENTIONS.md); catalog entries:
[../ENTITY_CATALOG.md](../ENTITY_CATALOG.md) §tax & compliance; ERD:
[../ERD/treasury-tax.md](../ERD/treasury-tax.md). Rate rows are global reference data
(non-tenant, seeded per pack version — ADR-0010); tenant rows are tenant-owned with RLS.

## `jurisdictions` (seed/reference — PHASE-009)

| Column | Type | Null | Constraints | Description |
|--------|------|------|-------------|-------------|
| country_code | text | NO | PK (ISO-3166 alpha-2) | Jurisdiction identifier |
| name / name_ar | text | NO | | Display names |
| vat_status | text | NO | ck: VAT_IN_FORCE, VAT_PLANNED, VAT_PLANNED_EINVOICING, NO_VAT | Scheme applicability |
| pack_version | text | NO | | Installed pack version |
| currency_code | text | NO | fk → currencies | Default currency |
| minor_units | int | NO | ck: 2–4 | Currency decimals (ISO-4217) |
| default_language | text | NO | | UI default for the pack |
| invoice_requirements | jsonb | NO | | Mandatory invoice fields per pack (frozen only after verification) |
| e_invoicing_regime | jsonb | YES | | Regime descriptor + adapter_id slot |
| effective_dates | daterange | NO | | Pack validity window |
| source_refs | jsonb | NO | | Official source references + verified_at |

## `jurisdiction_tax_rates` (seed/reference — PHASE-009)

| Column | Type | Null | Constraints | Description |
|--------|------|------|-------------|-------------|
| id | uuid | NO | PK | |
| country_code | text | NO | fk → jurisdictions | |
| treatment | text | NO | ck: STANDARD_RATED, ZERO_RATED, EXEMPT, OUT_OF_SCOPE, REVERSE_CHARGE, NOT_SUBJECT | Treatment (see [../../localization/TAX_ENGINE.md](../../localization/TAX_ENGINE.md)) |
| rate | numeric(7,4) | NO | ck rate >= 0 | Percentage (15.0000 = 15%) |
| category_code | text | YES | | Optional category (e.g., export, healthcare) |
| effective_from | date | NO | uq(country_code, treatment, category_code, effective_from) | Version window start |
| effective_to | date | YES | | NULL = open-ended |
| verification_status | text | NO | ck: REQUIRES_VERIFICATION, VERIFIED, IMPLEMENTED, TESTED | Compliance-matrix status |
| source_ref | text | NO | | Official source URL/reference to check |
| verified_at | date | YES | | When verified and by whom (compliance log) |

## `tax_registrations` (tenant — PHASE-009)

| Column | Type | Null | Constraints | Description |
|--------|------|------|-------------|-------------|
| id | uuid | NO | PK | |
| tenant_id | uuid | NO | fk → tenants (id, tenant_id pattern) | RLS-scoped |
| country_code | text | NO | fk → jurisdictions | |
| registration_no | text | YES | | VAT/TRN number as printed on invoices |
| status | text | NO | ck: REGISTERED, NOT_REGISTERED, DEREGISTERED | Drives engine behavior |
| effective_from | date | NO | | |
| effective_to | date | YES | | |
| created_at / updated_at / version / created_by | — | — | standard | Conventions §5 |

## `tax_codes` (tenant — PHASE-009)

| Column | Type | Null | Constraints | Description |
|--------|------|------|-------------|-------------|
| id | uuid | NO | PK | |
| tenant_id | uuid | NO | | RLS-scoped |
| code | text | NO | uq(tenant_id, code) | User-facing code |
| name / name_ar | text | NO | | |
| country_code | text | NO | fk → jurisdictions | Jurisdiction binding |
| treatment | text | NO | ck (same as rates) | Default treatment |
| is_default | boolean | NO | default false | Default for new items |
| active | boolean | NO | default true | |
| standard columns | — | — | | |

## `e_invoicing_submissions` (tenant — schema PHASE-009, populated PHASE-023)

| Column | Type | Null | Constraints | Description |
|--------|------|------|-------------|-------------|
| id | uuid | NO | PK | |
| tenant_id | uuid | NO | | RLS-scoped |
| doc_type | text | NO | | e.g., sales_invoice, credit_note |
| doc_id | uuid | NO | uq(adapter_id, doc_type, doc_id) | Source document |
| adapter_id | text | NO | | e.g., zatca-v2, eta-v1, fake |
| submission_kind | text | NO | ck: CLEARANCE, REPORTING, GENERATION_ONLY | Per regime mode |
| status | text | NO | ck: PENDING, GENERATED, SIGNED, SUBMITTED, ACCEPTED, REJECTED, REPORTED, FAILED | State machine ([../../localization/E_INVOICING_ARCHITECTURE.md](../../localization/E_INVOICING_ARCHITECTURE.md) §2) |
| attempts | int | NO | default 0 | Retry counter |
| last_error_code | text | YES | | Typed error |
| authority_refs | jsonb | YES | | Authority UUID/ICV/longitudes as per official spec |
| payload_file | uuid | YES | fk → file_objects | Encrypted stored payload |
| response_file | uuid | YES | fk → file_objects | Stored raw response |
| submitted_at | timestamptz | YES | | |
| accepted_at | timestamptz | YES | | |
| standard columns | — | — | | |

**Indexes:** `(tenant_id, status)` for the monitoring funnel; `(tenant_id, doc_type, doc_id)`;
partial `WHERE status IN ('PENDING','SUBMITTED')` for the worker poller.
