# Next Action

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-10-28

## The single next action

**Implement [PHASE-002 — Database & Migration Infrastructure](../implementation/phases/PHASE-002.md).**

**Why now:** PHASE-001 is COMPLETE (completion report: [../implementation/phases/reports/PHASE-001-COMPLETION.md](../implementation/phases/reports/PHASE-001-COMPLETION.md) with evidence; all gates green). PHASE-002 prerequisites are satisfied:
- PHASE-001 COMPLETE (verified via report + local CI-equivalent runs)
- ADRs required for PHASE-002 (ADR-0004 Postgres+Drizzle, ADR-0005 multi-tenancy, ADR-0006 UUIDv7, ADR-0008 jobs) are STABLE and implemented as far as PHASE-001 scaffolds them (domain-core UUIDv7, contracts, config).

**How:** Follow [AGENT_START_HERE.md](AGENT_START_HERE.md) steps 1–15, then execute PHASE-002's task table (T1…T9), verify its acceptance criteria (7 objective items including fresh+regression migrations, RLS attack tests A1–A5, negative RLS check, pg-boss, files skeleton, readiness), and produce `docs/implementation/phases/reports/PHASE-002-COMPLETION.md` with evidence.

## Prerequisites verified

| Prerequisite | Status | Evidence |
|--------------|--------|----------|
| PHASE-001 monorepo + CI + compose + lint gates | ✅ COMPLETE | [PHASE-001 report](../implementation/phases/reports/PHASE-001-COMPLETION.md) — `pnpm typecheck/lint/test/build` green, docs validation green, boundary meta-test green |
| ADR-0002 monorepo layout | ✅ respects layout | `apps/api`, `apps/web`, `packages/*` per ADR |
| ADR-0009 money primitives | ✅ implemented | `packages/domain-core` Money/Quantity/Rate + property tests |

## Do NOT

- Do not implement PHASE-003+ in the same run as PHASE-002.
- Do not scaffold business modules "while you are there".
- Do not modify ADRs or roadmap without change-control ([IMPLEMENTATION_PROTOCOL.md](IMPLEMENTATION_PROTOCOL.md) §3).
- Do not treat PHASE-001 as done without reading its completion report evidence.

## After PHASE-002 completes

Next eligible: PHASE-003 (Identity, Multi-Tenancy & Audit) — prerequisites will be satisfied after PHASE-002's tenant-isolation substrate lands.
