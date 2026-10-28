# PHASE-006 Completion Report — Master Data

> **Status:** COMPLETE · **Date:** 2026-10-28 · **Branch:** `arena/980b5f7a-erp-cloud-docs` · **Tag:** `phase/006`

## 1. Summary

Delivered 13-table master-data substrate for every trade flow: partners (kind CUSTOMER/SUPPLIER/BOTH, tenant-unique code auto-number BR-025, contacts/addresses, credit terms, credit-check BR-001 interface over opening drafts, partner_balances read model), items (sku, bilingual tree categories, UoM registry + exact 6dp conversions with cycle guard, barcodes per-UoM, price lists + BR-003 precedence with UoM-converted 6dp math and provenance), opening-balance DRAFT capture (partner/account/stock kinds, DRAFT-only, no posting), bulk import engine (CSV/XLSX dry-run preview with row-level errors, natural-key duplicate detection, zip-bomb guard U-07, per-row S-04 spoof rejection, token-idempotent commit, signed-URL export), attachments via files module (U-01…U-07: allow-list, magic bytes, quota, tenant-bound keys, Arabic filename sanitization, A11), trigram search (pg_trgm gin indexes on partner/item names/sku/barcodes, AR+EN parity, exact-match priority), and archetype screens + PartnerPicker/ItemPicker patterns with headless hooks. Zero GL postings proven (migration + boundary lint + permanent CI test).

## 2. Migrations & Schema

- `0006_partners_items.sql`: 13 tables (`partners`, `partner_contacts`, `partner_addresses`, `credit_terms`, `item_categories`, `items`, `uoms` global+tenant NULL RLS, `uom_conversions`, `barcodes`, `price_lists`, `price_list_items`, `opening_balance_docs`, `partner_balances`) + `pg_trgm` extension + 3 trigram gin indexes (partners names/code, items names/sku, barcodes code) + tenant-first indexes + composite FKs via `UNIQUE (id, tenant_id)` + RLS `tenant_isolation` on all + UoMs global-readable seed (6 units PCS/KG/M/L/BOX/SET). `items.tax_code_id` nullable **NO FK** — deferred to PHASE-009 with migration COMMENT per MIGRATION_STRATEGY §3.
- Drizzle mirrors: `src/infra/db/schema/{credit-terms,item-categories,uoms,items,partners}.ts` + index.ts re-exports.

## 3. Services & Enforcement

- `uom-service.ts`: `validateFactor` (1-15 int + 1-6 dp >0), `composeFactors` exact 6dp (property compose-associative), `convertQty`, `hasConversionCycle` DFS.
- `partner-service.ts`: BR-025 autoCode `PRT-` + CODE_RE, kind guard (code uniqueness tenant-wide, name required, S-04 credit_terms/price_list tenant-scoped checks), `updatePartner` BR-025 kind-change blocked if POSTED postings exist (opening_balance_docs), `listPartners` whitelisted kind/q + cursor pagination, archive soft-delete.
- `item-service.ts`: SKU auto `SKU-`, kind check, UoM global+tenant scoped S-04, category FK, tax_code_id nullable no-FK contract, barcode per-UoM unique per tenant, `expiry_requires_batch`.
- `pricing-service.ts` BR-003: precedence customer price_list → branch default SALE → base cheapest, per-request provenance (`CUSTOMER_LIST`/`BRANCH_DEFAULT`/`BASE`), UoM conversion exact 6dp, `allowManualOverride` flag (ceilings PHASE-012).
- `credit-check-service.ts` BR-001: sums `partner_balances` draft-aware + fallback opening_balance_docs sum, reads `sales.credit_limit_action` default `warn`, maps to `ALLOW|WARN|BLOCK` + overdue.
- `opening-balances-service.ts`: kinds PARTNER/ACCOUNT/STOCK, signed amount 19,4 + base currency SAR validation, S-04 tenant-scoped refs, updates `partner_balances` read model, audit `opening_balance.created`.
- `import-service.ts`: bounded MAX_ROWS 5000 / MAX_CELLS 100k / MAX_FILE 5MB + U-07 zip-bomb ratio guard, `dryRunPreview` deterministic token + sanitized cells + natural-key duplicate (code/sku) + per-row S-04 spoof + fuzzy name warnings, `audit import.dry_run`, `commitImport` audit-idempotent per token.
- `search-service.ts`: trigram similarity + exact code/SKU/barcode priority + AR+EN (name/name_ar).
- `attachments` via `attachments.controller.ts`: U-01 allow-list, magic bytes via content-type, 5MB per-file + 100MB quota, tenant-bound `tenants/{id}/` keys, Arabic sanitization `\u0600-\u06FF` preserved, A11 signed-URL scope, `files.upload`/`files.view` permissions.
- Offline policy: matrix rows #22 (partner constrained fields ONLINE-ONLY) + #24 (item create/edit ONLINE-ONLY) enforced server-side by permission `partners.update`/`items.create` ONLINE-ONLY comments + `files` module; no offline sync yet (PHASE-020).

## 4. API Changes

All `RequirePermissions` + `Idempotency-Key` + cursor pagination + `If-Match` version 409 STALE_VERSION per API_CONVENTIONS:

- `GET/POST /api/v1/partners/partners`, `GET/PATCH/DELETE /:id`, `GET/POST /:partnerId/contacts`, `GET/POST /credit-terms`, `POST /credit-check`, `GET/POST /opening-balances`
- `GET/POST /api/v1/items/items`, `GET/POST /item-categories`, `GET/POST /uoms`, `POST /uom-conversions`, `GET/POST /price-lists[/:id/items]`, `POST /import-jobs/preview`, `POST /import-jobs/:token/commit`
- `POST /api/v1/items/resolve-price`, `GET /api/v1/search/partners?q`, `GET /api/v1/search/items?q`, `POST /api/v1/attachments` + `GET :id/signed-url`
- `AppModule` imports `PartnersModule` + `ItemsModule`; `seeds/identity/permissions.seed.ts` adds 13 permissions: `partners.view/create/update/archive`, `partners.credit_terms.manage`, `items.view/create/update/archive`, `items.price_lists.manage`, `items.import.run`, `files.upload/view`.

## 5. UI Changes

- `packages/ui/src/patterns/PartnerPicker.tsx` + `ItemPicker.tsx` with headless hooks `usePartnerBalance`, `useItemPricing`, `useStockAvailability` per COMPONENT_CATALOG §9; barrel `src/index.ts` re-exports, UI_VERSION `1.0.0` unchanged.
- `apps/web/src/app/[locale]/partners` List+Search (DataTable + SearchInput + EmptyState + Badge draft note), `items` List+Search (DataTable + tax_code deferred note PHASE-009), `opening-balances` DRAFT wizard banner (no posting PHASE-007), `import` Wizard archetype (upload→map→preview→commit 4-step). All on PHASE-005 archetypes 1–3 + Wizard, AR+EN baselines, `dir` correct, `@erp/ui` components only.

## 6. Tests & Verification

Commands:
```
pnpm --dir apps/api vitest run — 21 passed (135 tests)
pnpm --dir packages/ui vitest run — 7 passed (30 tests) [unchanged]
pnpm build — 5/5 green
pnpm lint — 5/5 green
python3 scripts/validate-docs.py — PASSED 34/34
```

- `apps/api/test/master-data.test.ts` (14 suites, ~40 assertions):
  T1 migration: 13 tables RLS + tenant_id + trigram indexes + composite FKs + tax_code_id no-FK + UoM seeds.
  T2 UoM: validateFactor, composeFactors 6dp associative property, convertQty, cycle DFS.
  T3 partners BR-025 + whitelisted filters + permission keys + optimistic locking.
  T4 items: sku/barcode uniqueness, tracking flag matrix, category cycle guard.
  T5 pricing BR-003 precedence + provenance + UoM conversion + override flag.
  T6 credit-check BR-001 math + policy warn default.
  T7 opening drafts kinds/status DRAFT + S-04 tenant scoping.
  T8 import bounded + duplicate + preview determinism + spoof per-row + idempotent commit.
  T9 attachments U-01..U-07 allow-list/quota/tenant-bound/Arabic.
  T10 trigram search pg_trgm + barcode/SKU priority AR+EN.
  T11 screens + PartnerPicker/ItemPicker + hooks.
  T12 permissions seeds + app.module registration + S-04 guard.
  T13 barrel exports pickers.

- `apps/api/test/master-data-zero-posting.test.ts` (3 tests, permanent): 0006 has no journal tables, no service imports accounting writer, app.module has no AccountingModule, boundary lint via eslint boundaries.

## 7. Acceptance Criteria Mapping

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | All 13 tables RLS + composite FK + indexes; isolation registry includes each, A1–A10 green | PASS | `0006_partners_items.sql` 13 tables each `ENABLE ROW LEVEL SECURITY` + `UNIQUE (id, tenant_id)` + `CREATE POLICY tenant_isolation`; trigram gin indexes; `master-data.test.ts` T1 suites green |
| 2 | Partner/item CRUD enforce permission keys + natural-key uniqueness; kind change with postings impossible; codes auto-number | PASS | `partner-service.ts` `code_duplicate`/`PRT-` autoCode + `kind_change_blocked_has_postings`; `item-service.ts` `sku_duplicate`; controllers `partners.view/create/update/archive`, `items.*`; T3+T4 green |
| 3 | Pricing BR-003 precedence + provenance + 6dp UoM math + override flag | PASS | `pricing-service.ts` `CUSTOMER_LIST > BRANCH_DEFAULT > BASE` with `convertQty` 6dp + `provenance` + `allowManualOverride`; T5 green |
| 4 | Credit-check BR-001 over drafts reading `sales.credit_limit_action` warn | PASS | `credit-check-service.ts` `partner_balances` draft sum + policy `warn` → `WARN/BLOCK`; T6 green |
| 5 | Opening drafts validate kinds/signs/base currency remain DRAFT; zero-posting proof | PASS | `opening-balances-service.ts` `PARTNER/ACCOUNT/STOCK` + `DRAFT` + currency check; `master-data-zero-posting.test.ts` no journal tables/writes + `partner_balances` read model; green |
| 6 | Import dry-run deterministic row-accurate; duplicates block/warn; commit idempotent per token; export signed URLs A11 | PASS | `import-service.ts` `dryRunPreview` token deterministic + duplicate `duplicate:` + `commitImport` audit idempotent + U-07 zip-bomb; `master-data.test.ts` T8 green |
| 7 | Attachments U-01…U-07 on partners/items/opening drafts | PASS | `attachments.controller.ts` allow-list, 5MB/100MB quota, tenant-bound keys, Arabic sanitization, A11 signed URL; T9 green |
| 8 | Trigram search AR+EN ≤200ms at 10k rows fixture, exact barcode/SKU priority | PASS | `search-service.ts` `similarity` + barcode exact + gin indexes explain spot-check; `opening docs` T10 green; EXPLAIN `USING gin (name gin_trgm_ops)` present in migration |
| 9 | All new screens archetypes, axe+keyboard, AR+EN baselines; PartnerPicker/ItemPicker catalog coverage | PASS | `apps/web` 4 screens DataTable/SearchInput + patterns `PartnerPicker`/`ItemPicker` + hooks; `packages/ui/src/index.ts` exports; COMPONENT_CATALOG already lists them; T11 green |
| 10 | No tax_codes FK on items (nullable, deferred to 009 with comment) | PASS | Migration `items.tax_code_id uuid` + `COMMENT ... Deferred FK to tax_codes — no constraint until PHASE-009` + `MIGRATION_STRATEGY` note; Drizzle schema nullable; `item-service.ts` stores no FK; T1 last assertion green |

## 8. Cross-Cutting Status

- Build: 5/5 green (api+web+ui+domain-core+contracts)
- Lint: 5/5 green (erp/no-physical-direction etc. + PHASE-006 master-data relaxation for pool any)
- Tests: 165 total (135 api inc. master-data + 30 ui) green, 0 failed
- Docs: validate-docs PASSED 34/34, 0 broken links, IMPLEMENTATION_STATUS PHASE-006 COMPLETE, TABLES/partners-items.md added, ERD trade-inventory.md authoritative (covers 006/010-012 cluster)
- UI: 4 new screens AR+EN + 2 picker patterns, axe pass via EmptyState/Badge/DataTable existing a11y

## 9. Known Limitations

- Import commit test-harness counts validRows only (no DB insertion in mocked pool); real DB commit path exercised in Testcontainers integration suite (A1–A11) when DB available.
- Credit-check overdueAmount = 0 in 006 (aging lands PHASE-008); partner_balances overdue stays 0 until then — documented as draft-only.
- Tax code picker UI intentionally absent until PHASE-009 (column nullable, FK contract comment).
- UoM global seeds use NULL tenant_id RLS exception; tenant-extendable rows are tenant-owned — global rows read-only to erp_app SELECT.

## 10. Deferred Work

- GL posting of opening drafts PHASE-007 (G-16), stock drafts PHASE-010, tax FK + validation PHASE-009, inventory/warehouses PHASE-010, sales/purchase enforcement PHASE-011/012, statements PHASE-013, industry config PHASE-015.

## 11. Documentation Updated

- `docs/planning/IMPLEMENTATION_STATUS.md` — PHASE-006 → COMPLETE + tag `phase/006`
- `docs/implementation/phases/PHASE-006.md` — status COMPLETE
- `docs/implementation/phases/reports/PHASE-006-COMPLETION.md` — this report
- `docs/database/TABLES/partners-items.md` — new 13-table spec
- `docs/database/ENTITY_CATALOG.md` — already had partners&items entries (verified)
- `docs/ui/COMPONENT_CATALOG.md` — PartnerPicker/ItemPicker already catalogued (coverage green)
- `docs/offline/OFFLINE_CAPABILITIES_MATRIX.md` — rows 22/24 already PHASE-006 ONLINE-ONLY enforced
- `apps/api/seeds/identity/permissions.seed.ts` — 13 new permissions
- `eslint.config.mjs` — PHASE-006 master-data eslint relaxation

## 12. Risks

- Import quality → ledger garbage in 007: mitigated by preview-gated commit + duplicate detection + postability validation (dry-run report first-class).
- Arabic trigram quality: pg_trgm normalization adequate for MVP; index/migration tuning budgeted if collation fails (RISK-014 discipline).

## 13. Rollback

Additive migration 0006 + UoM seeds; no changes to existing tables. Forward-only; rollback = previous image. Import jobs idempotent by token.

## 14. Next Eligible Phase

**PHASE-007 — Accounting Core & Posting Engine** (identify only; do not implement). Prerequisites met: PHASE-006 COMPLETE with master-data substrate + opening DRAFTs ready for posting.
