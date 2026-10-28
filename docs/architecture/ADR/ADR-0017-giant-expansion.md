# ADR-0017 — Giant Expansion (EXP-001): Full Cycle + Verticals

> **Status:** ACCEPTED · **Date:** 2026-10-28 · **Owner:** Platform Architecture

## Context
Original blueprint (BLUEPRINT v1.1, 25 phases) deliberately excluded payroll/HR, fixed assets, hospitals/schools/agriculture to achieve fast MVP. Competitive analysis vs Al-Ameen/AlMotakamel/ONYX/Rasid (55 sectors) shows giant parity requires these.

## Decision
Expand from 25 → 34 phases (11 stages). Add financial depth (026–028) + universal commerce/verticals (029–033) + group consolidation (034). SCOPE_AND_NON_GOALS non-goals moved to in-scope with staged delivery. No microservices change (ADR-0001 holds). ENTITY_CATALOG grows 84 → ~110 tables, INDUSTRY_CATALOG 8 → 14 templates.

## Consequences
- MVP (014) unchanged — no delay to commercial launch.
- ULTRA GA at 034 becomes true giant parity.
- All new modules tenant-isolated + RLS + posting-engine integration where financial.
- Validation scripts updated to 34 phases.

## Alternatives
Keep 25 phases (rejected — fails giant competition requirement per owner directive 2026-10-28).
