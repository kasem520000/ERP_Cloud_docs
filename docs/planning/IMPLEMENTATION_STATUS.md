# Implementation Status

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-10-28

Single source of truth for what is **actually implemented** (vs. documented vs. planned).
Agents MUST keep this in sync with reality; the roadmap describes intent, this file
describes fact. Evidence = completion reports in
[../implementation/phases/reports/](../implementation/phases/) + CI runs + tags.

**Legend:** `NOT_STARTED` · `IN_PROGRESS` · `COMPLETE` (all exit criteria met with
evidence) · `BLOCKED` (with reason) · `WAIVED` (with decision record).

## Current state: BLUEPRINT v2.0 + PHASE-001..003 COMPLETE

The repository contains the consolidated blueprint (v1.1 baseline + v2.0 expansion)
plus the delivered trust substrate: PHASE-001 (monorepo scaffold, tooling, CI
configuration, dev stack — COMPLETE 2026-10-28), PHASE-002 (Database & Migration
Infrastructure — COMPLETE 2026-10-28), and PHASE-003 (Identity, Multi-Tenancy &
Audit — COMPLETE 2026-10-28 with evidence in
[reports/PHASE-003-COMPLETION.md](../implementation/phases/reports/PHASE-003-COMPLETION.md)).
PHASE-002 was verified in this sandbox against an embedded PostgreSQL 16 (same major
as the compose stack): migrations 0001–0002 apply cleanly, the RLS attack suite
A1–A5/A10 passes, `audit_events` is append-only by grants + trigger, pg-boss boots on
the `boss` schema, signed URLs round-trip through an S3-compatible server, and
`/health/ready` reports db + migrations + queue. The Testcontainers CI job
(`ci-db.yml` + `scripts/ci/migration-tests.ts`) is authored for Docker-capable hosts
and runs as a waived follow-up obligation alongside the PHASE-001 infra items — see
[NEXT_ACTION.md](../handoff/NEXT_ACTION.md) §Follow-up obligations.
Nothing may be described as implemented, tested, secure, or compliant beyond what is
recorded here with evidence.

| Phase | Title | Status | Completion report | Notes |
|-------|-------|--------|-------------------|-------|
| PHASE-001 | Repository & Engineering Foundation | COMPLETE | [PHASE-001-COMPLETION.md](../implementation/phases/reports/PHASE-001-COMPLETION.md) | All local gates green (typecheck/lint/boundaries/51 tests/build/docs 29–29 incl. v2.0/meta-test), re-verified 2026-10-28; CI-green + compose healthcheck waived to first infra availability per owner directive 2026-10-28; tag `phase/001` |
| PHASE-002 | Database & Migration Infrastructure | COMPLETE | [PHASE-002-COMPLETION.md](../implementation/phases/reports/PHASE-002-COMPLETION.md) | All 7 acceptance criteria pass with recorded output (embedded PG16: migrations 0001–0002, RLS attack suite A1–A5/A10, append-only guards, pg-boss dedupe, signed URLs, readiness); Testcontainers run waived to first Docker-capable host per PHASE-001 owner directive; tag `phase/002` |
| PHASE-003 | Identity, Multi-Tenancy & Audit | COMPLETE | [PHASE-003-COMPLETION.md](../implementation/phases/reports/PHASE-003-COMPLETION.md) | All 12 acceptance criteria pass with recorded output (embedded PG16: migrations 0001–0005; generated isolation suite A1–A10 × registered tables green; 105/105 db tests, 58 api unit tests; argon2id sessions + lockout + TOTP MFA + recovery + invitations; 199-key permission seed drift-checked; RBAC route registry + checklist; definer projections on erp_definer; bilingual email adapter on pg-boss; provisional BFF web screens AR/EN); mailpit/Playwright waived to first infra availability; tag `phase/003` |
| PHASE-004 | Tenant Provisioning & Platform Admin | COMPLETE | [PHASE-004-COMPLETION.md](../implementation/phases/reports/PHASE-004-COMPLETION.md) | All 11 acceptance criteria pass with recorded output (embedded PG16: migrations 0001–0008; generated isolation suite A1–A10 × 12 registered tables + platform-GUC mini-matrix P1–P5 green; 207/207 db tests, 58 api unit tests; public registration + idempotent provisionWorkspace (42-account CoA, 16 purposes, 8 roles); branches + branch-scope enforcement; BR-039 enforcement guard + BR-040 closure validator with PLACEHOLDER plans; rule-6 suspend/restore with session kill + login block + console-stays-up; S-07 platform plane via ops-tenant membership; §7 support access fully automated; 8 provisional AR/EN screens + BFF PATCH); Playwright waived to first infra availability; tag `phase/004` |
| PHASE-005 | Design System, i18n & RTL | NOT_STARTED | — | |
| PHASE-006 | Master Data | NOT_STARTED | — | |
| PHASE-007 | Accounting Core & Posting Engine | NOT_STARTED | — | |
| PHASE-008 | Treasury & Expenses | NOT_STARTED | — | |
| PHASE-009 | Tax Engine & Jurisdiction Packs | NOT_STARTED | — | |
| PHASE-010 | Inventory & Warehousing | NOT_STARTED | — | |
| PHASE-011 | Purchasing & Payables | NOT_STARTED | — | |
| PHASE-012 | Sales & Receivables | NOT_STARTED | — | |
| PHASE-013 | Reporting, Statements & Printing | NOT_STARTED | — | |
| PHASE-014 | Subscriptions, Billing & Onboarding | NOT_STARTED | — | MVP gate |
| PHASE-015 | Industry Framework & Templates | NOT_STARTED | — | |
| PHASE-016 | Point of Sale | NOT_STARTED | — | |
| PHASE-017 | Automotive & Distribution Templates | NOT_STARTED | — | |
| PHASE-018 | Manufacturing | NOT_STARTED | — | |
| PHASE-019 | CRM, Service & Projects | NOT_STARTED | — | |
| PHASE-020 | Offline Sync Foundation | NOT_STARTED | — | |
| PHASE-021 | Desktop Application | NOT_STARTED | — | |
| PHASE-022 | Android Application | NOT_STARTED | — | |
| PHASE-023 | Integrations & E-Invoicing | NOT_STARTED | — | |
| PHASE-024 | Security Hardening | NOT_STARTED | — | |
| PHASE-025 | Performance & GA Readiness | NOT_STARTED | — | GA gate |
| PHASE-026 | Fixed Assets & Depreciation | NOT_STARTED | — | v2.0 stage 9 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-027 | Cheques, Promissory Notes & Installments | NOT_STARTED | — | v2.0 stage 9 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-028 | Budgeting & Variance Control | NOT_STARTED | — | v2.0 stage 9 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-029 | Payroll: Salaries, Loans & End-of-Service | NOT_STARTED | — | v2.0 stage 9 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-030 | Wholesale & Electronics Templates | NOT_STARTED | — | v2.0 stage 10 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-031 | Healthcare Commercial Shell | NOT_STARTED | — | v2.0 stage 10 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-032 | Education Commercial Shell | NOT_STARTED | — | v2.0 stage 10 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-033 | Agriculture Commercial Shell | NOT_STARTED | — | v2.0 stage 10 (post-GA); scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |
| PHASE-034 | Multi-Entity Consolidation | NOT_STARTED | — | v2.0 stage 11 (post-GA) — Enterprise Depth gate; scope per [../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md) §B |

## Cross-cutting status

| Area | Status | Evidence |
|------|--------|----------|
| Database schema | SUBSTRATE — migrations 0001–0002 applied: roles (erp_migrate/erp_app/erp_readonly), tenant GUC + RLS policies (ENABLE+FORCE), minimal `tenants`, append-only `audit_events` (grants + guard trigger), `boss` schema, `erp._schema_state` mirror | `apps/api/migrations/`, db suite evidence in PHASE-002 report |
| API | INFRASTRUCTURE — `GET /health/live` + `GET /health/ready` (DB + migration state + queue liveness); internal services: AuditService, FilesService, JobsService | runtime smoke: ready report `{db: up, migrations: up, queue: up}` in PHASE-002 report |
| UI | SKELETON — Next.js `[locale]` home page with AR/EN + RTL/LTR demo | build SSG `/ar` + `/en`; runtime smoke in report |
| Tests | LOCAL (CI-equivalent gate) — 110 tests green: unit/property 78 (domain-core 38, contracts 11, api 29) + db suite 32 on embedded PG16 (RLS attacks, guards, jobs, files, readiness); hosted-CI run waived pending infra | `pnpm gate:local` output in PHASE-002 report |
| Security controls | ENFORCED AT THE DATABASE — non-owner app role + FORCE RLS policies + append-only grants + guard triggers, proven by the A1–A5/A10 attack suite; gitleaks/CODEOWNERS/boundary meta-test wired into CI | TENANT_ISOLATION §5 test output in PHASE-002 report |
| Compliance | NONE — no jurisdiction pack data verified against official sources | — |
| Deployment | NONE — dev compose + CI files (incl. new ci-db.yml); first hosted runs waived pending infra | `docker-compose.yml`, `.github/workflows/` |

## Update protocol (normative)

1. When a phase completes: set status `COMPLETE`, link its completion report, list the
   git tag (format `phase/NNN`), and update the cross-cutting table.
2. When scope slips or blocks: status `IN_PROGRESS`/`BLOCKED` with reason and linked
   decision record — never silently.
3. `COMPLETE` requires: all phase acceptance criteria verified, all automated tests
   green in CI, completion report merged. A phase with failing/skipped tests is
   `IN_PROGRESS` — regardless of how much code exists (directive §1.10–1.11).
