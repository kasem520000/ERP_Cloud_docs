# ERD — Treasury & Tax Cluster

> **Status:** STABLE · **Owner:** Database Architecture · **Updated:** 2026-10-27 · **Phases:** 008–009, 023

Core attributes only. Column-level specifications: tax/compliance tables in
[TABLES/tax-compliance.md](../TABLES/tax-compliance.md); treasury tables land in
[TABLES/](../TABLES/) per phase (PHASE-008) per the
[database README](../README.md#synchronization-rule-normative) sync rule.

```mermaid
erDiagram
  tenants ||--o{ cash_accounts : ""
  cash_accounts ||--o{ cash_movements : ""
  tenants ||--o{ expense_categories : ""
  expense_categories ||--o{ expenses : ""
  cash_accounts ||--o{ expenses : "paid-from"
  cash_accounts ||--o{ cash_transfers : "from/to"
  cash_accounts ||--o{ cashier_shifts : ""
  cash_accounts ||--o{ bank_statements : ""
  bank_statements ||--o{ bank_statement_lines : ""
  cash_movements ||--o| bank_statement_lines : "matched-to"
  tenants ||--o{ tax_registrations : ""
  jurisdictions ||--o{ tax_registrations : ""
  jurisdictions ||--o{ jurisdiction_tax_rates : "versioned rates"
  jurisdictions ||--o{ tax_codes : "defaults"
  tenants ||--o{ tax_codes : ""
  tax_codes ||--o{ sales_invoice_lines : "stamped-on"
  tenants ||--o{ e_invoicing_submissions : ""

  cash_accounts {
    uuid id PK
    text type "CASH|BANK|PETTY"
    uuid account_id FK "CoA ledger account"
    uuid branch_id FK
    text currency
    text status
  }
  cash_movements {
    uuid id PK
    uuid cash_account_id FK
    text direction "IN|OUT"
    numeric amount "19,4"
    text source_type
    uuid source_id
    date value_date
  }
  expenses {
    uuid id PK
    uuid expense_category_id FK
    uuid cash_account_id FK
    text payee
    numeric amount "19,4"
    text status
  }
  expense_categories {
    uuid id PK
    text code
    uuid account_id FK "expense account"
  }
  cashier_shifts {
    uuid id PK
    uuid cash_account_id FK
    uuid user_id FK
    numeric opening_amount "19,4"
    numeric counted_amount "19,4"
    text status
  }
  bank_statement_lines {
    uuid id PK
    uuid bank_statement_id FK
    date line_date
    numeric amount "19,4"
    text reference
    uuid matched_movement_id FK
  }
  jurisdictions {
    text country_code PK
    text vat_status "VAT_IN_FORCE|VAT_PLANNED|NO_VAT"
    text pack_version
  }
  jurisdiction_tax_rates {
    uuid id PK
    text country_code FK
    text treatment
    numeric rate "7,4"
    date effective_from
    date effective_to
    text source_ref
    date verified_at
  }
  tax_registrations {
    uuid id PK
    uuid tenant_id FK
    text country_code FK
    text registration_no
    text status "REGISTERED|NOT_REGISTERED|DEREGISTERED"
  }
  tax_codes {
    uuid id PK
    text code UK_per_tenant
    text treatment
    text country_code
  }
  e_invoicing_submissions {
    uuid id PK
    text doc_type
    uuid doc_id
    text adapter_id
    text status "PENDING|GENERATED|SIGNED|SUBMITTED|ACCEPTED|REJECTED|REPORTED"
    int attempts
    jsonb authority_refs
    text payload_file
    text response_file
  }
```

Tax rate rows are **seed/reference data** (non-tenant); tenants reference them via tax
codes with rate snapshots frozen on document lines ([TAX_ENGINE.md](../../localization/TAX_ENGINE.md)).
