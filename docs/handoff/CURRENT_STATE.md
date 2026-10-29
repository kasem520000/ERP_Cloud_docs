# Current State

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-10-28

What actually exists in this repository right now. Paired with
[../planning/IMPLEMENTATION_STATUS.md](../planning/IMPLEMENTATION_STATUS.md) (phase
table) and [NEXT_ACTION.md](NEXT_ACTION.md).

## Repository contents

- **Documentation blueprint v2.0 — COMPLETE** (v1.1 consolidated baseline + platform depth
  & breadth expansion per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md)): 240
  Markdown documents under `docs/` covering vision, product
  requirements, scope, glossary (EN↔AR), architecture (system overview, 18 ADRs,
  module boundaries, dependency rules, data flows, security, multi-tenancy, deployment,
  observability), planning (34-phase roadmap, dependency graph, acceptance criteria,
  status, release strategy, risk register), database (conventions, entity catalog, data
  dictionary, relationships, constraints/indexes, tenant isolation, migration strategy,
  backup/recovery, ERDs, table specs, seeds), product (personas, journeys, workflows,
  BR-001…056 business rules, industry/feature catalogs — 22 modules, 163 feature keys
  (125 v1.1 + 38 v2.0) — subscriptions & entitlements,
  configuration engine), accounting (principles, bilingual CoA, posting engine,
  document lifecycle, journal rules with golden postings G-01…G-32, AR/AP, inventory
  accounting, period closing,
  reconciliation, invariants INV-001…026), industries (framework + capability matrix +
  13 template manifests (8 v1.1 + 5 v2.0 commercial shells) + workflows + report
  catalog), localization (architecture,
  RTL/LTR, currency/precision, country packs for SA/AE/BH/KW/OM/QA/YE/EG/JO/IQ with
  compliance matrices + official-sources registry, tax engine, e-invoicing
  architecture), api (conventions, authentication, error model, idempotency,
  versioning, OpenAPI strategy, integrations catalog), ui (principles, tokens, design
  system, 49-component catalog, 12 page archetypes, navigation (10 groups), RTL rules,
  accessibility, motion, visual testing), reporting (architecture, report contract,
  catalog with 67 reports, financial statement rules, printing/export,
  reconciliation), offline (architecture, local DB, sync protocol, conflict
  resolution, idempotency, device security, capabilities matrix, failure recovery),
  security (threat model, authorization matrix, data protection, secrets, security
  test plan, incident response), testing (strategy, accounting tests with golden
  datasets, tenant isolation tests, sync chaos suite, regression, performance),
  operations (dev setup, environments, CI/CD, deployment, backup/restore runbook,
  disaster recovery, monitoring, troubleshooting), implementation (34 phase documents
  + phase/completion/code-review templates), decisions (records for pricing, payment
  provider, costing default, ZATCA scope, Yemen scope, observability vendors, and the
  v2.0 expansion set: platform expansion, fixed assets, notes & installments,
  budgeting, payroll scope, consolidation), and this handoff set.
- **Application code: PHASE-001 + PHASE-002 + PHASE-003 (all COMPLETE).** The
  pnpm + Turborepo monorepo with all local gates green (re-verified 2026-10-28):
  - `apps/api` — NestJS with `GET /health/live` + `GET /health/ready` (DB +
    migration state + queue liveness); modules: `audit` (append-only, transactional
    appends inside the caller's UoW + audit.view-gated query endpoint),
    `files` (S3 adapter + signed URLs + upload constraints, tenant-prefixed keys),
    `identity` (argon2id login, rotating opaque sessions 12 h/30 min, progressive
    lockout + per-IP windows, TOTP MFA with replay rejection + hashed recovery
    codes, stateless HMAC reset tokens, single-use invitations, RBAC admission via
    `@RequirePermissions` + route registry, roles editor primitives, tenant-context
    middleware + interceptor inside the RLS UoW), `notifications` (AR/EN email
    templates, minimal SMTP client, pg-boss queue with dedupe); infra: drizzle pool
    (non-owner `erp_app`), tenant-context unit-of-work (`withTenant`, transaction-local
    GUC, ALS), pg-boss queue client (`boss` schema, WORKER_MODE), ERROR_MODEL
    exception filter + success envelopes + Idempotency-Key presence guard, pino
    logging with correlation ids + redaction, OTel api no-op wiring.
  - `apps/web` — Next.js BFF + provisional AR/EN screens (PHASE-003): session
    cookie (httpOnly/Secure/SameSite=Lax) + CSRF double-submit, generic proxy,
    login / forgot-password / accept-invitation / dashboard + tenant switcher /
    users + invitations / sessions revoke / MFA setup / roles editor / change
    password; typed dictionaries with parity assertion.
  - `apps/desktop`, `apps/mobile`, `packages/ui` — declared README stubs only
    (PHASE-021/022/005).
  - `packages/domain-core` — UUIDv7, `Money`/`Quantity`/`Rate` (ADR-0009 decimal
    semantics, half-up rounding, 3-decimal currencies), `Result`, domain errors,
    `CalendarDate`; 38 unit/property tests green.
  - `packages/contracts` — zod registry v0 (empty), error-code enum seed, wire-format
    schemas per API_CONVENTIONS §7; 11 tests green.
  - `packages/config` — shared strict tsconfig bases, ESLint config with
    module-boundary enforcement (proven by the negative meta-test), Prettier.
  - Tooling: pnpm workspaces + Turborepo, ESLint boundaries + custom money/RTL rules,
    `dependency-cruiser` graph rules (web→api violation caught in verification),
    Docker Compose dev stack (postgres:16/minio/mailpit/api/web), GitHub Actions CI
    (typecheck/lint/unit/build/docs-validation/gitleaks/e2e-stub/negative-boundary-test
    + the new ci-db.yml Testcontainers job), CODEOWNERS stub, `.env.example`.
  - Migrations `0001_core_infra.sql` … `0005_system_role_templates_seed.sql`
    (drizzle-kit journal `NNNN_description.sql` convention): PHASE-002 substrate
    plus the PHASE-003 identity cluster — 9 tables, variant command-specific RLS
    for roles/role_permissions, `template_seed` path, NOLOGIN BYPASSRLS role
    `erp_definer` owning the pre-GUC definer projections, 199-key permission seed
    (drift-checked against AUTHORIZATION_MATRIX in the gate) + 9 role templates
    with 413 grants. `tenants` grew its full profile in PHASE-004 (below).
  - PHASE-004 provisioning cluster — migrations `0006_tenancy_provisioning.sql`
    (currencies/countries seeded reference tables, tenants profile expansion +
    status swap incl. OFFBOARDED, audit_events platform widening: nullable
    tenant_id + via_platform_admin + platform-read policy, branches,
    tenant_settings, plans (platform RLS + seed path), subscriptions, entitlements,
    support_sessions, `erp.tenant_active_entitlements` definer projection,
    `erp.seed_platform_tenant()` ops-tenant bootstrap), `0007_accounts_schema.sql`
    (accounts + account_purposes, composite FKs, created early for CoA
    instantiation), `0008_platform_seeds.sql` (PLACEHOLDER plans starter/business/
    enterprise incl. closure-completion keys, 13 industry templates, the 42-row
    bilingual CoA template with 16 purpose markers).
  - PHASE-004 modules: `configuration` (feature-catalog mirror + BR-040 closure
    validator, settings-schema registry with zod schemas, in-process §9 event bus
    + config cache) and `tenancy` (registration, onboarding provisionWorkspace,
    branches + branch-scope enforcement, entitlements service + RequireFeature
    guard, typed settings service, lifecycle suspend/restore with session kill,
    support access §7, platform console with per-use platform audit). The
    platform plane = `@PlatformScope()` routes over the seeded operations tenant
    (platform_admin role from the template; first staff user bootstrapped by ops).
  - Prior migrations `0001_core_infra.sql` + `0002_rls_macro.sql` (drizzle-kit journal
    `NNNN_description.sql` convention): roles `erp_migrate`/`erp_app`/`erp_readonly`
    (no passwords in SQL — dev credentials via `scripts/db-dev-credentials.ts`),
    `erp.current_tenant_id()` GUC helper, minimal `tenants`, append-only
    `audit_events` (grants + `erp.audit_events_guard()`), RLS ENABLE+FORCE with
    `tenant_isolation` policies, `erp.apply_tenant_policy()` macro,
    `erp._schema_state` mirror, `boss` schema (owned by `erp_app`).
  - Completion flip (2026-10-28): the CI-green and `docker compose up` healthcheck
    evidence items are waived to first infrastructure availability by project-owner
    directive — the CI-equivalent local gate (`pnpm gate:local`) is green and is the
    recorded substitute; follow-ups tracked in the phase report §Deferred evidence.
- **Git:** initialized on `main` during PHASE-001 (the pre-implementation state was a
  plain directory — see the phase report's doc-reality reconciliation); baseline
  committed and tagged `blueprint/v1.1`; PHASE-001 implementation committed and tagged
  `phase/001`; blueprint v2.0 expansion committed on top.

## Status of the world (honest statement per directive §24)

- **Designed:** everything in `docs/` — this is the blueprint, not a claim of working
  software.
- **Implemented:** PHASE-001 engineering foundation + PHASE-002 database &
  migration infrastructure + PHASE-003 identity/tenancy/audit core (migrations
  0001–0005; authentication, sessions, MFA, RBAC with the seeded 199-key catalog,
  invitations, tenant-context enforcement, audit wiring, email adapter, BFF web
  screens). Business modules (accounting, sales, …) remain PHASE-007+.
  Infra-bound evidence (hosted CI, compose boot, Testcontainers run, mailpit
  capture, Playwright journey) waived per owner directive 2026-10-28 with
  local-gate equivalence recorded.
- **Tested:** locally — 233 tests (api unit 58 + domain-core 38 + contracts 11 +
  db suite 105 on embedded PostgreSQL 16 + web typecheck/lint): the generated
  tenant-isolation suite A1–A10 over every registered tenant-owned table with the
  registry negative proof, identity flows (R-01/02/03/05, M-01/02/04/06/07/08/10,
  S-01/02/03, invitations, permission checklist), HTTP end-to-end through the
  real Nest pipeline, email over a real SMTP session, append-only guards,
  pg-boss dedupe, signed URLs, readiness + boundary meta-test via the
  CI-equivalent `pnpm gate:local`; hosted-CI runs remain waived follow-ups
  (U1) pending infrastructure.
- **Verified against official sources:** no compliance item is VERIFIED; all country
  tax data is BASELINE_RESEARCH with REQUIRES_VERIFICATION flags
  ([../localization/compliance-matrix/README.md](../localization/compliance-matrix/README.md)).
- **Production-ready / compliant / secure:** no such claims are made anywhere, and
  none may be made until phases complete with evidence.

## Known open items

- Open questions OQ-001…OQ-010 in
  [../ASSUMPTIONS_AND_OPEN_QUESTIONS.md](../ASSUMPTIONS_AND_OPEN_QUESTIONS.md) —
  notable: pricing matrix (OQ-002), payment provider (OQ-003), ZATCA scope (OQ-004).
- Decision records OPEN under [../decisions/](../decisions/README.md).
- Risks under watch: [../planning/RISK_REGISTER.md](../planning/RISK_REGISTER.md)
  top-5 watchlist.
