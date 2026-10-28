# Current State

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-10-28 — PHASE-004 COMPLETE (34 phases, 19 ADRs)

What actually exists in this repository right now. Paired with
[../planning/IMPLEMENTATION_STATUS.md](../planning/IMPLEMENTATION_STATUS.md) (phase
table) and [NEXT_ACTION.md](NEXT_ACTION.md).

## Repository contents

- **Documentation blueprint v1.1 — COMPLETE** (202 Markdown documents under `docs/` covering vision, product requirements, scope, glossary, architecture, planning, database, product, accounting, industries, localization, api, ui, reporting, offline, security, testing, operations, implementation, decisions, and handoff). Audited via [../CONSOLIDATION_VALIDATION_REPORT.md](../CONSOLIDATION_VALIDATION_REPORT.md) (23/23 checks green).

- **Application code: PHASE-001 FOUNDATION + PHASE-002 DATABASE SUBSTRATE + PHASE-003 IDENTITY & AUDIT CORE + PHASE-004 TENANCY PROVISIONING COMPLETE** — monorepo + DB/RLS/audit/pg-boss/files + identity (0003 8 tables, sessions/MFA/RBAC/tenant-context) + tenancy (0004/0005 tenants profile/branches/plans/entitlements/settings/support + CoA 12+7, onboarding idempotent, BranchScope, BR-039/040, suspend/restore, PlatformScope) —
  - **PHASE-003:** `apps/api/migrations/0003_identity_core.sql`, `src/modules/identity/**`, 70 tests, ADR-0018
  - **PHASE-004:** `apps/api/migrations/0004_tenancy_provisioning.sql` + `0005_accounts_schema.sql`, `src/modules/tenancy/**` (registration/onboarding/branches/entitlements/settings/lifecycle/support), `infra/auth/*`, 87 tests, ADR-0019 —
  - **Monorepo:** `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.editorconfig`, `.prettierrc`, `pnpm-workspace.yaml`, `eslint.config.mjs`, `.dependency-cruiser.cjs`, `.env.example`, `docker-compose.yml`, `.github/workflows/ci.yml`, `AGENTS.md`, `README.md`
  - **Apps:** `apps/api` (NestJS + `/health/live`), `apps/web` (Next.js 15 + `[locale]` RTL/LTR demo), `apps/desktop` + `apps/mobile` (README stubs for PHASE-021/022)
  - **Packages:** `packages/domain-core` (UUIDv7, Money/Quantity/Rate via decimal.js, Result, errors, CalendarDate + 57 tests), `packages/contracts` (zod registry v0 + error-code enum), `packages/ui` (stub, PHASE-005), `packages/config` (tsconfig bases, eslint base, prettier config)
  - **Scripts:** `scripts/validate-docs.py` + `scripts/validate_docs.py` (docs validation, 0 broken links), `scripts/check-boundaries.sh` + fixtures proving boundary enforcement, `scripts/extract_manifests.py` stub
  - **Evidence:** `docs/implementation/phases/reports/PHASE-001-COMPLETION.md` with CI-equivalent local runs (typecheck/lint/test/build/docs/boundary all green), commit `arena/980b5f7a-erp-cloud-docs`

- **Git:** `main` (blueprint `blueprint/v1.0` + `blueprint/v1.1`) + `arena/980b5f7a-erp-cloud-docs` (PHASE-001 implementation). Tag `phase/001` to be created on merge.

## Status of the world (honest statement per directive §24)

- **Designed:** everything in `docs/` — blueprint is authoritative, validated (23/23 checks).
- **Implemented:** PHASE-001 + PHASE-002 + PHASE-003 (identity 8 tables, sessions/MFA/RBAC/tenant-context) + PHASE-004 (tenancy provisioning: registration idempotent onboarding, branches, entitlements BR-039/040, settings typed, suspend/restore tenant_suspended, support 4h, PlatformScope console) — see reports/PHASE-004-COMPLETION.md.
- **Tested:** 87 tests api (70 PHASE-003+17 PHASE-004 = 87, plus 109 earlier = 196 total incl domain-core) + docs validation + boundary meta-test + build/typecheck/lint all green; 18 test files, isolation S-02/S-07 + dependency closure green.
- **Verified against official sources:** no compliance item is VERIFIED; all country tax data is BASELINE_RESEARCH with REQUIRES_VERIFICATION flags ([../localization/compliance-matrix/README.md](../localization/compliance-matrix/README.md)).
- **Production-ready / compliant / secure:** no such claims are made. Gitleaks scanning is wired; no secrets in repo (`.env.example` only).

## Verification (2026-10-28 local run)

```
pnpm typecheck  → 8 tasks successful
pnpm test       → 87 tests passed (api, 18 files) + 109 earlier — see PHASE-004-COMPLETION.md (18 files, 87 tests, 0 failed)
pnpm lint       → eslint . --max-warnings 0 green (boundaries + import + dependency-cruiser)
pnpm build      → 5 tasks successful (api + web + 3 packages, web SSG /en /ar 102kB)
python3 scripts/validate-docs.py → PASSED (0 broken links, 34/34 phases, 19 ADRs incl. ADR-0019, 8 manifests)
bash scripts/check-boundaries.sh → PASSED (depcruise 0 violations, fixture 1 error correctly detected)
# DB CI (CI-only with live PG): pnpm db:migrate (fresh+regression) + check-rls + check-catalog + RLS A1/A3/guard probes — see .github/workflows/ci-db.yml
```

## Evidence for PHASE-002 (2026-10-28)

- Migrations `apps/api/migrations/0001_core_infra.sql` (roles, GUC, tenants minimal, audit_events RLS+guard, file_objects, _infra_probe FK) + `0002_boss_and_rls_macro.sql` (boss schema, apply_tenant_policy macro)
- Infra `apps/api/src/infra/db` (Pool 20, AsyncLocalStorage, withTenant SET LOCAL, migrate.ts), `infra/jobs` pg-boss, `modules/files` S3 adapter (tenant prefix), observability (pino+request-id+OTel no-op), `/health/ready`
- Tests 47 new api tests (see PHASE-002 report) + CI db job with RLS A1–A3/guard proofs
- Docs: ENTITY_CATALOG, TABLES/tenancy-identity, ERD/tenancy-identity, DEVELOPMENT_SETUP synced; validation PASSED
- Completion report: `docs/implementation/phases/reports/PHASE-002-COMPLETION.md`

## GIANT EXPANSION — EXP-001 (2026-10-28)

**Decision:** Blueprint expanded 25 → 34 phases (11 stages) to achieve giant parity vs Al-Ameen/AlMotakamel/ONYX/Rasid-55.

- **New scope committed:** Fixed assets & multi-method depreciation (026), HR/payroll/GOSI/EOS (027-028), wholesale tier pricing (029), electronics/mobiles warranty/RMA/repair (030), healthcare HIS Lite (031), education SIS Lite (032), agriculture/livestock (033), group consolidation + hyperscale (034).
- **Docs updated:** SCOPE_AND_NON_GOALS (non-goals → in-scope), MASTER_ROADMAP (34 phases), ENTITY_CATALOG (+26 tables → ~110), INDUSTRY_CATALOG (8 → 14 templates), PRODUCT_REQUIREMENTS (FR-ACC/HR/WHO/ELE/HLT/EDU/AG/GRP), FEATURE_CATALOG (+11 feature keys), MODULE_BOUNDARIES (+9 modules), PHASE_ACCEPTANCE_CRITERIA (026–034), PHASE_DEPENDENCY_GRAPH, ADR-0017.
- **Validation:** `validate-docs.py` passes 34/34 phases, 18 ADRs, 0 broken links.
- **Impact on implemented code:** PHASE-002 financial core remains valid — its RLS/posting foundations are extended, not reopened. Future asset/payroll postings will reuse `erp.current_tenant_id()` and posting engine (ADR-0007).

## Known open items

- Open questions OQ-001…OQ-010 in [../ASSUMPTIONS_AND_OPEN_QUESTIONS.md](../ASSUMPTIONS_AND_OPEN_QUESTIONS.md)
- Decision records OPEN under [../decisions/](../decisions/README.md)
- Risks under watch: [../planning/RISK_REGISTER.md](../planning/RISK_REGISTER.md) top-5
- Next phase: PHASE-003 (Identity) — prerequisites satisfied (PHASE-002 COMPLETE). Giant phases 026–034 await after 025 (see MASTER_ROADMAP).
