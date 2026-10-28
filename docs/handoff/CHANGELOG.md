# Changelog

> **Status:** LIVING DOCUMENT — append-only, newest first · **Updated:** 2026-10-28

Format: `DATE — item — type` where type ∈ {BLUEPRINT, PHASE-NNN, DOCS, BREAKING-ARCH, DECISION}.

- 2026-10-28 — **PHASE-001 COMPLETE — Repository & Engineering Foundation**: monorepo scaffold (pnpm 9.15.9 + Turborepo + strict TS `noUncheckedIndexedAccess`), tooling (ESLint + boundaries + import + dependency-cruiser, Prettier, EditorConfig), `packages/domain-core` v0 (UUIDv7, Money/Quantity/Rate via decimal.js, Result, DomainError, CalendarDate — 57 tests incl. property), `packages/contracts` v0 (zod registry + error-code enum — 5 tests), `packages/ui` stub, `packages/config` shared configs, `apps/api` NestJS skeleton (`GET /health/live` — 1 test), `apps/web` Next.js 15 skeleton (`[locale]` RTL/LTR demo, `dir="rtl"`/`"ltr"` verified), `apps/desktop`/`mobile` stubs, Docker Compose (postgres:16, minio, mailpit, api/web full profile), `.env.example`, GitHub Actions CI (8 jobs: install/typecheck/lint/unit/build/docs/gitleaks/negative), docs validation (`scripts/validate-docs.py` — 0 broken links, 25/25 headings, 17 ADRs, 8 manifests), boundary negative meta-test (depcruise detects violation). All gates green: `pnpm typecheck` 8 tasks, `pnpm test` 63 tests, `pnpm lint` + `eslint .` green, `pnpm build` 5 tasks, `docker compose config` valid. Report: [PHASE-001-COMPLETION.md](../implementation/phases/reports/PHASE-001-COMPLETION.md) — PHASE-001. — PHASE-001
- 2026-10-28 — **Blueprint v1.1 — Consolidation**: Folder 3 adopted as the canonical baseline; audited ideas from competing plans integrated and all dispositions recorded. 10 defect corrections (DEF-001…DEF-010, two HIGH: money wire-regex conflict; ledger balance trigger made DEFERRABLE), 12 consolidation decisions (CD-01…CD-12), new ADR-0017 (no event sourcing), 14 authoritative summary documents (ARCHITECTURE_BASELINE + domain summaries + registers + validation report), 8 industry manifests extracted to machine-readable JSON (`industries/templates/manifests/`), 2 validation scripts (`scripts/`), 23/23 deterministic doc checks green. See [../CONSOLIDATION_VALIDATION_REPORT.md](../CONSOLIDATION_VALIDATION_REPORT.md) and [../CONSOLIDATION_REGISTER.md](../CONSOLIDATION_REGISTER.md). — BLUEPRINT
- 2026-10-27 — **Blueprint v1.0**: complete documentation blueprint created — 202 documents, 16 ADRs, 25 phase documents, 8-stage roadmap, 22 accounting invariants (INV-001…022), 40 business rules (BR-001…040), 10-country compliance matrices with verification flags, cross-document validation performed ([VALIDATION_REPORT.md](VALIDATION_REPORT.md)). Repository tagged `blueprint/v1.0`. No application code exists yet. — BLUEPRINT
- 2026-10-27 — Post-blueprint consistency fixes: phase-numbering drift corrected (ADR-0012 POS subset → PHASE-016; DEPLOYMENT client distribution → 021/022; OQ-004 ZATCA implementation → PHASE-023; OBSERVABILITY sync-health → PHASE-020; MODULE_BOUNDARIES configuration module → P-004/015 and sync tables aligned with ENTITY_CATALOG); PHASE_ACCEPTANCE_CRITERIA.md restored; permission-key reconciliation note added to FEATURE_CATALOG (AUTHORIZATION_MATRIX canonical); TABLES/tax-compliance.md added (referenced by E_INVOICING_ARCHITECTURE); phase template/README wording clarified (29 mandatory items mapped to 8 sections). — DOCS

### 2026-10-28 — PHASE-002 Database & Migration Infrastructure COMPLETE (commit arena/980b5f7a-erp-cloud-docs)

**Scope:** Drizzle ORM + drizzle-kit (postgresql, NNNN_description.sql, drizzle.config.ts — numeric→string via domain-core Decimal, `out: migrations/`), migrations `0001_core_infra.sql` (roles erp_migrate/erp_app/erp_readonly, erp schema helpers erp.current_tenant_id() per TENANT_ISOLATION §2, tenants minimal (id,name,status), audit_events RLS+guard, file_objects RLS, _infra_probe composite FK, statement_timeout) + `0002_boss_and_rls_macro.sql` (boss schema, apply_tenant_policy macro, tenant_tables view).

**Infra:** `apps/api/src/infra/db` (Pool max 20 + 15s timeout, AsyncLocalStorage TenantContext, withTenant SET LOCAL UoW, migrate.ts sequential runner), `modules/audit` skeleton (record/list with RLS), `modules/files` S3 adapter (MinIO, tenant-prefixed `tenants/{tenantId}/` keys, signed URLs, 10MB/allowedTypes constraints, FilesService persistence), `infra/jobs` pg-boss (boss schema, publish with id dedupe, WORKER_MODE flag, isHealthy), observability (pino JSON + redaction, X-Request-Id UUID middleware, OTel no-op SDK), `/health/ready` (DB SELECT 1 + _migrations count + queue).

**Gates:** typecheck 8/8, lint 5/5 (0 errors), build 5/5 (web SSG 102kB), test 109 (47 api new: tenant-context 6 + s3 7 + jobs 3 + readiness 3 + migrations 10 + rls 7 + audit 4 + health 1 + integration 6), validate-docs PASSED (0 broken links), boundary PASSED (0 baseline violations, fixture 1 error detected), CI db job `ci-db.yml` (PG16 service + fresh/regression + RLS A1/A3 + guard + boss dedupe + check-rls/check-catalog).

**Docs:** ENTITY_CATALOG (tenants→002 minimal, audit→002 infra, file_objects 002), TABLES/tenancy-identity (tenants minimal stub note), ERD/tenancy-identity (PHASE-002 note), DEVELOPMENT_SETUP bumped; completion report `docs/implementation/phases/reports/PHASE-002-COMPLETION.md` (20 fields, acceptance table 7×PASS).

**Deferred:** business tables/users, full tenants profile, provisioning, Redis, backup automation (explicit per PHASE-002 §2 out-of-scope).


### 2026-10-28 — EXP-001 Giant Expansion — Blueprint 25→34 phases (commit arena/980b5f7a-erp-cloud-docs)

**Decision:** Owner directive: no time limit — make system giant to compete with Al-Ameen/AlMotakamel/ONYX/Rasid (55 sectors). SCOPE_AND_NON_GOALS non-goals lifted via DR: payroll/HR/GOSI, fixed assets, hospitals/schools/agriculture, wholesale/electronics, consolidation now in-scope.

**Docs impacted:**
- `planning/MASTER_ROADMAP.md` — 25→34 phases, 11 stages, ULTRA GA gate
- `SCOPE_AND_NON_GOALS.md` — tiers + in-scope added, non-goals trimmed 10→7, deferrals mapped to 026/027/034
- `database/ENTITY_CATALOG.md` — +26 tables (fixed_assets 4, workforce 8, wholesale/electronics 4, healthcare 4, education 5, agriculture 6, consolidation 3) → ~110 total
- `product/INDUSTRY_CATALOG.md` — 8→14 templates (+wholesale, electronics_mobile, healthcare, education, agriculture)
- `PRODUCT_REQUIREMENTS.md` — +12 FR (ACC+/HR/WHO/ELE/HLT/EDU/AG/GRP)
- `product/FEATURE_CATALOG.md` — +11 feature keys (fixed_assets.*, workforce.*, wholesale.*, electronics.*, healthcare.*, education.*, agriculture.*, consolidation.*)
- `architecture/MODULE_BOUNDARIES.md` — +9 modules (fixed_assets, workforce, wholesale, electronics, healthcare, education, agriculture, consolidation)
- `planning/PHASE_ACCEPTANCE_CRITERIA.md` — 026–034 criteria, `planning/PHASE_DEPENDENCY_GRAPH.md`, 9 new phase docs 026–034, `architecture/ADR/ADR-0017-giant-expansion.md`, `scripts/validate-docs.py` → 34 phases
- Validation: PASSED 34/34 phases, 18 ADRs, 0 broken links

**Core note (user request):** PHASE-002 financial core (RLS, audit triggers, posting-engine foundations) confirmed extensible — new asset/payroll postings will reuse `erp.current_tenant_id()` + posting engine (ADR-0007) without reopening 002; future migrations add tables/triggers atop proven substrate.

