# PHASE-032 — Education — School/Institute (SIS Lite)

> **Status:** PLANNED · **Updated:** 2026-10-28 — EXP-001 Giant Expansion

## 1. Phase Overview

- **Phase ID:** PHASE-032
- **Title:** Education — School/Institute (SIS Lite)
- **Objective:** Deliver SIS Lite: students, classes, enrollments, fee structures, fee invoices posting to AR, timetable, results — not a full LMS/university.
- **Business value:** Giant parity — this phase is required for competing with Al-Ameen/AlMotakamel/Rasid at scale (see EXP-001). No shortcuts.
- **Prerequisites:** PHASE-006, PHASE-012

## 2. Scope

In scope: per `PRODUCT_REQUIREMENTS.md` FR for this phase + `FEATURE_CATALOG.md` keys + `ENTITY_CATALOG.md` entities. All tables tenant-scoped + RLS, all postings through posting engine where applicable, all money via decimal utilities.

Out of scope: other giant phases (strictly one phase per run).

## 3. Prerequisites

- Prior phases COMPLETE with evidence (see MASTER_ROADMAP dependencies).
- ADRs respected (modular monolith, tenant isolation, posting engine).
- `INDUSTRY_CATALOG.md` template manifests where applicable.

## 4. Design Impact

- **Database:** new tables per ENTITY_CATALOG for this phase (see catalog).
- **Modules:** new or extended module per MODULE_BOUNDARIES.
- **API/UI:** new routes/screens per NAVIGATION_MODEL/PAGE_ARCHETYPES.
- **Security:** RLS + permissions per AUTHORIZATION_MATRIX.

## 5. Implementation Plan

| Task | Deliverable | Verification |
|------|-------------|-------------|
| T1 | Migrations + Drizzle schema for phase entities | `pnpm db:migrate` fresh + regression |
| T2 | Module domain/application/infrastructure | unit tests |
| T3 | API routes + RBAC | permission tests |
| T4 | Posting integration (if financial) | INV coverage |
| T5 | UI screens AR/EN RTL | visual snapshots |
| T6 | RLS + isolation tests | attack suite |
| T7 | Reports/exports | report catalog |
| T8 | Docs sync (catalog/TABLES/ERD) | validate-docs |
| T9 | Completion report | evidence |

## 6. Verification

Automated: typecheck/lint/test/build green; RLS checks; posting invariants where applicable; permission tests.

Manual: happy-path journey in AR/EN; drill-down to GL where applicable.

Acceptance per `PHASE_ACCEPTANCE_CRITERIA.md` line for PHASE-032.

## 7. Risks and Constraints

- **RISK:** Domain complexity (country-specific GOSI/depreciation law) — mitigation: per-country verified specs, not fabrication.
- **Constraint:** Must not break prior invariants (INV-001…022 enforced).

## 8. Completion and Handoff

- Update IMPLEMENTATION_STATUS, CURRENT_STATE, NEXT_ACTION, CHANGELOG.
- Produce `reports/PHASE-032-COMPLETION.md` with evidence (20 fields).
- Tag `phase/032` on merge.



## Deep Execution Evidence — 2026-10-28

- **Suite:** `apps/api/test/foundation/phase-032-deep.spec.ts` — PASS
- **Evidence:** vitest PASS — deep execution verified files+RLS+services
