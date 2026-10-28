# TABLES — Partners & Items Cluster (PHASE-006)

> **Status:** STABLE · **Owner:** Database Architecture · **Updated:** 2026-10-28 · **Phases:** 006

Column-level specification for the partners & items cluster, consistent with [ENTITY_CATALOG.md](../ENTITY_CATALOG.md), [DATABASE_CONVENTIONS.md](../DATABASE_CONVENTIONS.md), [DATA_DICTIONARY.md](../DATA_DICTIONARY.md), and [ERD/trade-inventory.md](../ERD/trade-inventory.md). Drizzle schema is the machine-readable mirror (`apps/api/src/infra/db/schema/{credit-terms,item-categories,uoms,items,partners}.ts`). All tables are tenant-owned + RLS unless noted. Migration: `apps/api/migrations/0006_partners_items.sql`.

Standard columns (`id uuid PK UUIDv7`, `tenant_id`, `created_at`, `updated_at`, `version` where noted) apply per DATABASE_CONVENTIONS §5.

## `credit_terms` (PHASE-006)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` + standard | — | — | — | `UNIQUE (id, tenant_id)` | composite-FK anchor |
| `code` | text | no | — | `uq_credit_terms_tenant_code` | e.g. net_30 |
| `name`/`name_ar` | text | no/yes | — | — | Bilingual |
| `days` | integer | no | 0 | >=0 | Net days |
| `description` | text | yes | — | — | Notes |
| `is_active` | boolean | no | true | — | Archive flag |

## `item_categories` — bilingual tree (PHASE-006)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` + standard | — | — | — | — | — |
| `code` | text | no | — | `uq_item_categories_tenant_code` | Natural key |
| `name`/`name_ar` | text | — | — | — | Bilingual |
| `parent_id` | uuid | yes | — | FK (parent_id, tenant_id) → self | Tree; cycle rejected app-side |

## `uoms` — global + tenant extensible (PHASE-006)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK | — |
| `tenant_id` | uuid | yes | — | FK tenants, nullable | NULL = global seed (PCS, KG…) |
| `code` | text | no | — | unique (code, tenant_id) | e.g. PCS |
| `name`/`name_ar` | text | — | — | — | Bilingual |

RLS: `USING (tenant_id IS NULL OR tenant_id = erp.current_tenant_id())` — global readable, writable own tenant only.

## `uom_conversions` (PHASE-006)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` | — | — | — | — | — |
| `from_uom_id` | uuid | no | — | FK (from_uom_id, tenant_id) → uoms | — |
| `to_uom_id` | uuid | no | — | FK (to_uom_id, tenant_id) → uoms | — |
| `factor` | numeric(19,6) | no | — | >0 | Exact decimal factor; property compose-exactly at 6dp |

## `items` (PHASE-006)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` + standard | — | — | — | — | — |
| `sku` | text | no | — | `uq_items_tenant_sku` | Tenant-unique |
| `name`/`name_ar` | text | — | — | — | Bilingual |
| `kind` | text | no | — | ck STOCK\|SERVICE\|COMPOSITE | — |
| `uom_id` | uuid | no | — | FK → uoms | Base UoM |
| `category_id` | uuid | yes | — | FK → item_categories | — |
| `tax_code_id` | uuid | yes | — | **NO FK** — deferred to PHASE-009 (expand-migrate-contract) | Nullable per MIGRATION_STRATEGY §3 |
| `costing_method` | text | no | WAC | ck WAC\|FIFO | Stored now, enforced 010 |
| `track_batch`/`track_serial`/`track_imei`/`has_expiry` | boolean | no | false | — | Flags; has_expiry requires track_batch |
| `status`/`deleted_at` | — | — | ACTIVE | — | Soft-delete capable |

Indexes: tenant-first + trigram gin on name, name_ar, sku.

## `barcodes` (PHASE-006)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` | — | — | — | — | — |
| `item_id` | uuid | no | — | FK (item_id, tenant_id) → items | Composite tenant FK |
| `code` | text | no | — | `uq_barcodes_tenant_code` | Per-tenant unique |
| `uom_id` | uuid | yes | — | FK → uoms | Per-UoM barcode |

## `price_lists` + `price_list_items` (PHASE-006)

`price_lists`: id, tenant_id, code `uq`, name/name_ar, currency char(3), kind ck SALE\|PURCHASE, valid_from/valid_to, is_active.
`price_list_items`: id, tenant_id, price_list_id FK → price_lists, item_id FK → items, uom_id FK → uoms, unit_price numeric(19,6), min_qty numeric(19,6) tier.

## `partners` (PHASE-006)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` + standard | — | — | — | — | — |
| `kind` | text | no | — | ck CUSTOMER\|SUPPLIER\|BOTH | BR-025: kind change blocked if postings exist |
| `code` | text | no | — | `uq_partners_tenant_code` | Auto-numbering BR-025 |
| `name`/`name_ar` | text | — | — | — | Bilingual |
| `tax_number` | text | yes | — | — | — |
| `credit_limit` | numeric(19,4) | yes | 0 | — | Server-enforced credit policy (BR-001 interface) |
| `credit_terms_id` | uuid | yes | — | FK → credit_terms | S-04 tenant-scoped |
| `price_list_id` | uuid | yes | — | FK → price_lists | BR-003 customer list |
| `status`/`deleted_at` | — | — | ACTIVE | — | Archive |

Indexes: tenant-first + trigram on name, name_ar, code.

## `partner_contacts` / `partner_addresses` (PHASE-006)

Child tables of partners via composite FK (partner_id, tenant_id) → partners. Contacts: name, phone, email, role. Addresses: type ck BILLING\|SHIPPING\|BOTH, line1, city, country_code.

## `opening_balance_docs` — DRAFT capture (PHASE-006 draft, PHASE-007 posting)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` + standard | — | — | — | — | — |
| `kind` | text | no | — | ck PARTNER\|ACCOUNT\|STOCK | — |
| `partner_id`/`account_id`/`item_id` | uuid | yes | — | FK tenant-scoped per kind | Validated per kind |
| `amount` | numeric(19,4) | no | — | — | Signed, base currency only in 006 |
| `currency` | char(3) | no | SAR | — | Base currency enforced |
| `status` | text | no | DRAFT | ck DRAFT\|POSTED\|VOIDED | 006: always DRAFT; POSTED in 007 |
| `doc_date` | date | no | today | — | — |

## `partner_balances` — read model (PHASE-006 draft-aware, PHASE-007 journal-maintained)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` | — | — | — | — | — |
| `partner_id` | uuid | no | — | FK → partners, `uq_tenant_partner` | — |
| `open_balance` | numeric(19,4) | no | 0 | — | Sum over DRAFT docs in 006 |
| `overdue_amount` | numeric(19,4) | no | 0 | — | 0 in 006, aged in 008 |
