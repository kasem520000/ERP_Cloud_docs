# Changelog

> **Status:** LIVING DOCUMENT — append-only, newest first · **Updated:** 2026-10-28

Format: `DATE — item — type` where type ∈ {BLUEPRINT, PHASE-NNN, DOCS, BREAKING-ARCH, DECISION}.

- 2026-10-28 — **PHASE-003 — Identity, Multi-Tenancy & Audit (COMPLETE)**:
  migrations `0003_identity_core.sql` (9 identity tables per TABLES/tenancy-identity;
  composite tenant FKs; variant command-specific RLS for roles/role_permissions +
  `template_seed` path TO erp_migrate — templates readable for cloning, never
  forgeable/mutable/deletable by the app role; `audit_events.actor_id → users(id)`
  expand-FK), `0004_permissions_seed.sql` (199 keys verbatim from AUTHORIZATION_MATRIX
  §3 — drift checker `scripts/check-permissions-drift.ts` in the gate), and
  `0005_system_role_templates_seed.sql` (9 templates, 413 grants). New role
  `erp_definer` (NOLOGIN BYPASSRLS) owns the pre-GUC SECURITY DEFINER projections
  (`user_membership_options`, `user_effective_permissions`, `invitation_by_token`) —
  FORCE RLS binds even the table owner, so definer ownership MUST bypass. Identity
  module: argon2id (64 MB/3/1, per-hash params), opaque rotating sessions (12 h
  absolute re-anchored on rotation / 30 min idle), progressive lockout (5 → 15 min,
  never permanent) + per-IP windows, TOTP MFA (RFC 6238, replay-rejecting timestep
  tracking, hashed single-use recovery codes), stateless HMAC reset tokens bound to
  the user version (single-use; documented deviation — no resets table in the 9-table
  set), 72 h single-use invitations. RBAC: `@RequirePermissions` guard + route
  registry (`infra/auth/route-permissions.ts`) + generated checklist test;
  `identity.mfa.manage` is runtime self-scope. Tenant-context interceptor wraps
  handlers in the `withTenant` UoW (S-02 suspension → 503 TENANT_SUSPENDED).
  Notifications skeleton: AR/EN plain-text templates, minimal SMTP client
  (EHLO/STARTTLS/AUTH PLAIN/DATA), pg-boss `notifications-email` queue with
  deterministic-UUID dedupe. Web (apps/web): BFF session cookie (httpOnly/Secure/
  SameSite=Lax) + CSRF double-submit + generic proxy; provisional screens login /
  forgot-password / accept-invitation / users / sessions / mfa / roles / settings
  with typed AR/EN dictionaries (~115 keys, parity-asserted). **Verified against
  embedded PostgreSQL 16: 105/105 db tests** — generated isolation suite A1–A10 ×
  every registered tenant-owned table (36) + registry negative proof, flows (20:
  R-01/02/03/05, M-01/02/04/06/07/08/10, S-01/02/03, invitations, checklist),
  HTTP end-to-end (12: 401/403+audit/200, oracle-uniform login, idempotency 422,
  MFA 423, reset-200-always), email over a real SMTP session (5); 58 api unit
  tests; typecheck/lint/depcruise/drift/web gates green. House rule discovered:
  tsx/esbuild emits no decorator metadata — all Nest DI uses explicit `@Inject`
  tokens. Waivers: mailpit capture + Playwright journey (first Docker/host),
  Testcontainers (standing), same class as PHASE-001/002 items.
  — PHASE-003

- 2026-10-28 — **PHASE-002 — Database & Migration Infrastructure (COMPLETE)**:
  migrations `0001_core_infra.sql` (roles erp_migrate/erp_app/erp_readonly — no
  passwords in SQL; `erp.current_tenant_id()` GUC; minimal `tenants`; append-only
  `audit_events` with grants + `erp.audit_events_guard()`; RLS ENABLE+FORCE;
  `boss` schema) and `0002_rls_macro.sql` (`erp.apply_tenant_policy()` macro +
  `erp._schema_state` readiness mirror); drizzle-kit workflow (`NNNN_description.sql`
  + journal); `withTenant()` unit-of-work (transaction-local GUC, ALS, transactional
  audit appends); pg-boss queue client + worker mode (`WORKER_MODE`); files module
  (S3 adapter, tenant-prefixed keys, signed URLs, upload constraints — A11); pino
  logging with X-Request-Id correlation + redaction; OTel api no-op wiring;
  `/health/ready` (DB + migration state + queue liveness); CI checkers
  (`scripts/check-rls.ts` RLS presence + ENTITY_CATALOG drift; `scripts/ci/migration-tests.ts`
  Testcontainers runner + ci-db.yml). **Verified against embedded PostgreSQL 16**:
  attack suite A1–A5/A10 zero leaks, append-only rejection (grants 42501 + trigger
  P0001), pg-boss dedupe (one execution for duplicate enqueues), signed-URL
  round-trip + expiry + A11, readiness `{db: up, migrations: up, queue: up}`; full
  gate green (typecheck/lint/depcruise/78 unit/32 db/build/docs 29–29/meta-test).
  Scoped repairs: compose/DEVELOPMENT_SETUP database naming unified (`erp`);
  DEVELOPMENT_SETUP filter names fixed (@erp/api); ci.yml `branches: [main]` typo
  repaired; Dockerfile runtime entry switched to the tsx workspace-source model
  (ADR-0002; production bundling stays PHASE-014+). Report:
  [../implementation/phases/reports/PHASE-002-COMPLETION.md](../implementation/phases/reports/PHASE-002-COMPLETION.md);
  tagged `phase/002`. — PHASE-002
- 2026-10-28 — **PHASE-001 flip to COMPLETE**: full local gate re-verified green after
  the blueprint v2.0 docs merge (`pnpm gate:local` exit 0 — typecheck, lint,
  boundaries, 51 tests, build, docs validation **29/29**, negative meta-test); the two
  infrastructure-bound evidence items (first hosted-CI green run, `docker compose up`
  healthcheck) are **waived to first infrastructure availability by project-owner
  directive (2026-10-28)** — recorded as follow-up obligations in
  [../implementation/phases/reports/PHASE-001-COMPLETION.md](../implementation/phases/reports/PHASE-001-COMPLETION.md)
  §Deferred evidence; tagged `phase/001`. — PHASE-001/DECISION
- 2026-10-28 — **Blueprint v2.0 — Platform Depth & Breadth Expansion**: 9 new phases
  (PHASE-026…034) in stages 9–11 — financial depth (fixed assets, cheques/notes/PDC,
  installments, budgeting, payroll) + 5 industry templates (wholesale, electronics,
  healthcare, education, agriculture commercial shells) + multi-entity consolidation
  (ADR-0018); 6 new modules/38 feature keys/23 entities/16 purposes/G-21…G-32/
  INV-023…026/BR-041…056/17 reports/10th navigation group; governed by
  [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) ED-01…ED-19; MVP (PHASE-014) and GA
  (PHASE-025) gates unchanged. — BLUEPRINT/DECISION
- 2026-10-28 — **PHASE-001 — Repository & Engineering Foundation (IN_PROGRESS)**:
  pnpm + Turborepo monorepo scaffolded — `apps/api` NestJS skeleton (`GET /health/live`,
  runtime smoke HTTP 200), `apps/web` Next.js `[locale]` AR/EN RTL/LTR skeleton
  (SSG both locales), desktop/mobile/ui README stubs, `packages/domain-core`
  (UUIDv7, Money/Quantity/Rate per ADR-0009 with half-up rounding and 3-decimal
  currencies, Result, CalendarDate; 38 tests), `packages/contracts` (registry v0,
  error-code seed, wire schemas; 11 tests), `packages/config` (strict tsconfig,
  ESLint with module-boundary enforcement + money/RTL custom rules, Prettier);
  `dependency-cruiser` graph rules; Docker Compose dev stack; GitHub Actions CI
  (gitleaks, docs validation, negative boundary meta-test); CODEOWNERS; root
  README/AGENTS. All local gates green (`pnpm gate:local`); scoped repairs: ADR-0002
  desktop/mobile phase refs corrected (canon 021/022), DEVELOPMENT_SETUP package
  filter names fixed. Pending for COMPLETE: first CI green run + compose
  healthcheck (see
  [../implementation/phases/reports/PHASE-001-COMPLETION.md](../implementation/phases/reports/PHASE-001-COMPLETION.md)).
  — PHASE-001
- 2026-10-28 — **Blueprint v1.1 — Consolidation**: Folder 3 adopted as the canonical
  baseline; audited ideas from competing plans integrated and all dispositions recorded.
  10 defect corrections (DEF-001…DEF-010, two HIGH: money wire-regex conflict; ledger
  balance trigger made DEFERRABLE), 12 consolidation decisions (CD-01…CD-12), new
  ADR-0017 (no event sourcing), 14 authoritative summary documents
  (ARCHITECTURE_BASELINE + domain summaries + registers + validation report), 8
  industry manifests extracted to machine-readable JSON
  (`industries/templates/manifests/`), 2 validation scripts (`scripts/`), 23/23
  deterministic doc checks green. See [../CONSOLIDATION_VALIDATION_REPORT.md](../CONSOLIDATION_VALIDATION_REPORT.md)
  and [../CONSOLIDATION_REGISTER.md](../CONSOLIDATION_REGISTER.md). — BLUEPRINT
- 2026-10-27 — **Blueprint v1.0**: complete documentation blueprint created — 202
  documents, 16 ADRs, 25 phase documents, 8-stage roadmap, 22 accounting invariants
  (INV-001…022), 40 business rules (BR-001…040), 10-country compliance matrices with
  verification flags, cross-document validation performed
  ([VALIDATION_REPORT.md](VALIDATION_REPORT.md)). Repository tagged `blueprint/v1.0`.
  No application code exists yet. — BLUEPRINT
- 2026-10-27 — Post-blueprint consistency fixes: phase-numbering drift corrected
  (ADR-0012 POS subset → PHASE-016; DEPLOYMENT client distribution → 021/022;
  OQ-004 ZATCA implementation → PHASE-023; OBSERVABILITY sync-health → PHASE-020;
  MODULE_BOUNDARIES configuration module → P-004/015 and sync tables aligned with
  ENTITY_CATALOG); PHASE_ACCEPTANCE_CRITERIA.md restored; permission-key
  reconciliation note added to FEATURE_CATALOG (AUTHORIZATION_MATRIX canonical);
  TABLES/tax-compliance.md added (referenced by E_INVOICING_ARCHITECTURE); phase
  template/README wording clarified (29 mandatory items mapped to 8 sections). — DOCS

- 2026-10-28 — PHASE-004 COMPLETE (tag `phase/004`): Tenant Provisioning &
  Platform Administration — public registration (per-IP + global rate limits,
  atomic tenant+owner+trial+audit), provisionWorkspace idempotent CoA
  instantiation (42 accounts + 16 purposes + 8 roles + numbering/fiscal/
  jurisdiction defaults), branches + branch-scoped membership enforcement,
  typed tenant_settings (L5) with §9 invalidation events, entitlements service
  with BR-039 server-side enforcement + BR-040 dependency-closure validation
  (PLACEHOLDER plans per OQ-002), rule-6 lifecycle (suspend kills sessions +
  support sessions, login blocked, console stays up, restore revives),
  matrix-§7 support access (opt-in/ticket, 4h box, lazy expiry, per-action
  via_platform_admin audit, enumerated reads, tenant termination), the platform
  admin console on the new PlatformScope plane (ops-tenant membership; per-use
  audited cross-tenant reads; entitlement edits; plan assignment; audit
  viewer), the platform-scope audit widening (tenant_id NULL rows +
  via_platform_admin on both trails), 8 provisional AR/EN screens, and the full
  isolation evidence: A1–A10 over 12 registered tenant tables + the platform-GUC
  mini-matrix. 207/207 db tests, all local gates green. Catalog markers synced
  (accounts 004/007, data_export→014, numeral_system default → latn). — CODE
