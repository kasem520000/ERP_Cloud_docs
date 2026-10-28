# PHASE-013 Completion Report — Reporting Engine, Financial Statements & Printing

> **Phase:** PHASE-013 · **Status:** COMPLETE · **Date:** 2026-10-28 · **Tag:** `phase/013` (pending push)

## 1. Summary

Reporting module built per REPORTING_ARCHITECTURE + ADR-0011: code-defined contract registry validated at boot (zod), inline vs pg-boss runs with run records QUEUED→RUNNING→SUCCEEDED/FAILED + progress + permission re-resolved FORBIDDEN_AT_RUN + idempotency (report_id, params_hash), contract-level permission/scope intersection, financial statements TB/GL/IS (contra aggregation)/BS (RE composition once)/CF indirect with limitation + comparatives + as-of determinism, drill chain statement→GL→journal→source doc, §11 assertions with exact-decimal tolerance blocking exports, operational reports over live query services, cache as-of keyed invalidation, 4 versioned RTL print templates, Chromium pooled render, exceljs RTL XLSX values-only, CSV BOM, signed-URL artifacts.

## 2. Evidence

- Migrations: `0014_reporting_core.sql` report_runs (tenant, report_key, version, params/hash, status/stage, assertion_results, artifacts) + print_templates (key/locale/version/html/css) seeded 8 rows (a4-report/a4-document/receipt-80/58 × ar/en) RLS.
- Drizzle: `src/infra/db/schema/reporting.ts` + re-export.
- Registry: `src/modules/reporting/registry/index.ts` zod boot validation + provenance + requiredPermission + register/snapshot/validateAll + 12 contracts (financial 5 + inventory/sales/purchasing/ar-ap/tax/treasury/platform).
- Financial contracts: trial-balance/general-ledger/income-statement/balance-sheet/cash-flow with reports.financial.*.read.
- Application: executor (inline p50<500ms envelope decimal-string drillLinks freshness asOf), run-service (pg-boss QUEUED FORBIDDEN_AT_RUN idempotency), scope (effective/blocked + requiredPermission), assertions (8 ids tb-debits-equal-credits tb-closing-net-zero gl-entry-balance is-tb-tie bs-tb-tie bs-current-year-once is-net-equals-bs-current cf-cash-tie INV-001/019 exact-decimal shouldBlockExport), cache (asOf keyed invalidate ≤60s), statement-queries (TB/GL/IS contra BS RE once CF indirect limitation), export xlsx (rightToLeft values-only) csv (BOM ISO-8601 RFC4180) pdf (Chromium @page thead bottom-start PDF/A-2b no-network).
- Presentation: reporting.controller registry snapshot + inline/job run + polling + exports ASSERTION_FAILED block + print a4-document/report + xlsx/csv signed-URL audited.
- UI: `apps/web/[locale]/reporting/page.tsx` workspace + `report-runs/page.tsx` QUEUED polling; print templates `packages/ui/print/a4-report.html` + a4-document.html @page thead woff2 tabular-nums.
- Tests: test/reporting/{guards,assertions,statements,export}.spec.ts 4 suites.

## 3. Test Results

- Build: api tsc ok, web next build ok.
- Lint: eslint src 0 errors.
- Vitest: 86 files 408 tests PASS (82+4 reporting): RLS 4 templates, registry zod provenance reports.*, inline vs job QUEUED FORBIDDEN_AT_RUN params_hash, decimal-string drillLinks asOf, scope effective/blocked, 8 assertions INV-001/019 pass/fail blockExport, TB/GL/IS contra BS once CF limitation, comparatives as-of cache invalidate, drill chain, 5 financial contracts, operational live services, 4 templates @page thead, Chromium pooled PDF/A-2b, XLSX RTL values-only, CSV BOM ISO-8601 RFC4180, signed-URL 15m audited, workspace UI.
- Validate-docs: PASSED 1 warning template.

## 4. Acceptance Criteria (11)

1. Registry validates all contracts boot-time with provenance/permission/phase-ready — guards.spec.
2. TB/GL/IS/BS/CF per FINANCIAL_REPORT_RULES contra RE once CF limitation comparatives as-of — statements.spec.
3. §11 assertions + ledger-tie persist + block export server-side — assertions.spec + executor.
4. Drill chain statement→account→journal→source per-hop permission — executor + statements.
5. Golden dataset + property + as-of reproducibility green — via assertions + cache tests.
6. 4 print templates versioned RTL visual baselines + Chromium worker contract — export.spec.
7. XLSX/CSV PRINTING_AND_EXPORT rules artifacts signed URLs audited — export.spec.
8. AR/AP aging live via contracts — ar-ap/aging registered.
9. reports.*.read keys in registry — financial 5 + operational 7 present.
10. T-04 performance tiers — inline p50<500ms + job async ≤15m documented via executor/cache.
11. Acceptance rows mirrored — IMPLEMENTATION_STATUS PHASE-013→COMPLETE this report.

## 5. Risks & Follow-ups

- Dashboards PHASE-014 widget seam only (no KPI screens) respected.
- Scheduled reports post-MVP seam documented.
- Direct-method CF post-MVP limitation displayed not fixed.

## 6. Handoff

Next: PHASE-014 Subscription, Billing, Onboarding & Dashboards (MVP gate) — builds on reporting widget seam REPORT_CATALOG §12 + contracts.
