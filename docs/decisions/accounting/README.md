# Accounting Decision Records

> **Status:** STABLE · **Owner:** Accounting Domain Architecture · **Updated:** 2026-10-27

Accounting **policy defaults** that the product ships with — the choices tenants see in
onboarding and that industry templates inherit. Process and format: [../README.md](../README.md).
Approver: **product owner**, with the accounting domain owner as author/reviewer.

## Scope boundary (read first)

This folder decides *defaults and scope*, never *rules*:

- The [invariants](../../accounting/ACCOUNTING_INVARIANTS.md) are non-negotiable and are
  **not** decided here (INV-022: configuration cannot override accounting mathematics;
  invariant changes follow the invariants file's own maintenance protocol).
- Posting mechanics, journal rules, and the reversal-only correction model are
  architecture/spec decisions in [../../accounting/](../../accounting/) documents and
  ADRs — linking, not duplicating, them is this folder's job.
- What *does* belong here: costing-method default, fiscal-calendar conventions beyond
  the documented assumptions, depreciation/rounding policy defaults if/when introduced,
  and any accounting-behavior option exposed to tenants onboarding.

## Index

| Record | Title | Status | Notes |
|--------|-------|--------|-------|
| [DR-001-costing-method-default.md](DR-001-costing-method-default.md) | Costing method default (WAC, FIFO opt-in) | **ACCEPTED** 2026-10-27 | Formalizes assumption A-005; governs PHASE-010 |

## Inputs expected in records here

1. The linked assumption/ADR/accounting spec sections the default interacts with.
2. The tenant-facing consequence (what onboarding shows, what is changeable later, and at
   what cost — e.g., INV-017's dated-revaluation requirement for method switches).
3. Industry-template impact: which templates (if any) override the default and under
   which documented rule.

## Records expected here (open the record when the topic becomes real)

| Topic | Notes |
|-------|-------|
| Fiscal-calendar conventions beyond A-004 (e.g., a tenant-requested Hijri fiscal year variant) | Open only if customer evidence appears; isolated to the `accounting` module per A-004's consequence note |
| Depreciation policy defaults | When/if fixed-asset accounting enters scope (post-GA candidates) — not before |
| Rounding-difference posting policy refinements | Only if a jurisdiction pack requires a documented deviation from ADR-009 defaults (compliance folder would co-own) |
| Any proposal to expose a second costing default per industry template beyond [DR-001](DR-001-costing-method-default.md)'s rule | Amendment to DR-001 — template manifests are the only override path |
