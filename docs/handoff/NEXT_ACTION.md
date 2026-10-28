# Next Action

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-10-27

## The single next action

**Implement [PHASE-001 — Repository & Engineering Foundation](../implementation/phases/PHASE-001.md).**

Why now: the blueprint is complete and internally validated; PHASE-001 has no
prerequisites; every later phase depends on its foundations (monorepo, CI gates,
boundary enforcement, dev environment, docs tooling).

How: follow [AGENT_START_HERE.md](AGENT_START_HERE.md) steps 1–15, then execute
PHASE-001's task table (T1…T10), verify its acceptance criteria (six objective items),
and produce `docs/implementation/phases/reports/PHASE-001-COMPLETION.md` with evidence.

## After PHASE-001 completes

Next eligible: PHASE-002 (Database & Migration Infrastructure) — its prerequisites
will be satisfied; the implementing agent must still verify them per protocol.

## Do NOT

- Do not implement PHASE-002+ in the same run as PHASE-001.
- Do not scaffold business modules "while you are there".
- Do not modify the ADRs or the roadmap without the change-control process
  ([IMPLEMENTATION_PROTOCOL.md](IMPLEMENTATION_PROTOCOL.md) §3).
