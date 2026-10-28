# Next Action

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-10-28

## The single next action

**Implement [PHASE-003 — Identity, Multi-Tenancy & Audit](../implementation/phases/PHASE-003.md).**

**Why now:** PHASE-002 is COMPLETE (completion report: [../implementation/phases/reports/PHASE-002-COMPLETION.md](../implementation/phases/reports/PHASE-002-COMPLETION.md) with evidence; all gates green). PHASE-001 is COMPLETE. PHASE-003 prerequisites are satisfied:
- PHASE-002 COMPLETE (verified via report + local CI-equivalent runs: typecheck/lint/test/build/docs/boundaries green, migrations 0001/0002 + RLS A1–A3 + guard + boss proofs in ci-db.yml)
- ADRs required for PHASE-003 (ADR-0005 tenancy, ADR-0006 UUIDv7, ADR-0015 auth) are STABLE and respected (tenant-context ALS + withTenant UoW already land in PHASE-002).
- Full tenants profile, users, memberships, sessions, audit exposure land in PHASE-003 per roadmap.

**How:** Follow [AGENT_START_HERE.md](AGENT_START_HERE.md) steps 1–15, then execute PHASE-003's task table, verify its acceptance criteria, and produce `docs/implementation/phases/reports/PHASE-003-COMPLETION.md` with evidence.

## Prerequisites verified

| Prerequisite | Status | Evidence |
|--------------|--------|----------|
| PHASE-002 DB substrate (Drizzle, RLS, audit, pg-boss, files, ready) | ✅ COMPLETE | [PHASE-002 report](../implementation/phases/reports/PHASE-002-COMPLETION.md) — 109 tests (47 api new), migrations 0001/0002, RLS A1–A3/guard proofs, ci-db.yml |
| PHASE-001 monorepo + CI + compose + lint gates | ✅ COMPLETE | [PHASE-001 report](../implementation/phases/reports/PHASE-001-COMPLETION.md) — pnpm typecheck/lint/test/build green, docs validation green, boundary meta-test green |
| ADR-0004 Postgres+Drizzle, ADR-0005 tenancy, ADR-0008 jobs | ✅ respects layout | `apps/api/src/infra/db` + `drizzle.config.ts` + `migrations/` per ADRs |

## Do NOT

- Do not implement PHASE-004+ in the same run as PHASE-003.
- Do not scaffold business modules "while you are there".
- Do not modify ADRs or roadmap without change-control ([IMPLEMENTATION_PROTOCOL.md](IMPLEMENTATION_PROTOCOL.md) §3).
- Do not treat PHASE-002 as done without reading its completion report evidence.

## After PHASE-003 completes

Next eligible: PHASE-004 (Tenant Provisioning & Platform Admin) — prerequisites will be satisfied after PHASE-003's identity substrate lands.

> **Giant roadmap:** After PHASE-025 (GA), 9 giant phases (026–034) deliver fixed assets/HR/wholesale/electronics/healthcare/education/agriculture/consolidation for ULTRA GA. See `docs/planning/MASTER_ROADMAP.md` (11 stages).

