# Next Action

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-10-28

## The single next action

**Execute PHASE-005 — Design System, i18n & RTL Foundation** per
[../implementation/phases/PHASE-005.md](../implementation/phases/PHASE-005.md):
the design tokens, component library, typography, and the i18n/RTL foundation
every later screen inherits — replacing the provisional styling shipped by
PHASE-003/004 (login, admin, registration, onboarding, console screens).

Why now: PHASE-004 is COMPLETE — the provisioning substrate is frozen:
registration → onboarding (42-account CoA template instantiation + 16 purposes +
8 roles) → branches → typed settings → entitlements (BR-039 server-side
enforcement + BR-040 dependency closure, PLACEHOLDER plans) → rule-6 lifecycle
(session kill + login block) → §7 support access → the platform console, all
audited on both trails (tenant rows + NULL-tenant platform rows). Evidence:
[reports/PHASE-004-COMPLETION.md](../implementation/phases/reports/PHASE-004-COMPLETION.md).

How:

PHASE-004 is COMPLETE (2026-10-28, tag `phase/004`; evidence:
[../implementation/phases/reports/PHASE-004-COMPLETION.md]) — the provisioning
substrate is frozen: registration → onboarding (42-account CoA + 16 purposes +
8 roles) → branches → typed settings → entitlements (BR-039 guard + BR-040
closure, PLACEHOLDER plans) → rule-6 lifecycle → §7 support access → platform
console, all audited on both trails (tenant rows + NULL-tenant platform rows).

PHASE-003 remains COMPLETE (2026-10-28, tag `phase/003`; evidence:
[../implementation/phases/reports/PHASE-003-COMPLETION.md]).

## Next eligible: PHASE-005 — Design System, i18n & RTL Foundation

1. Follow the handoff protocol: read the PHASE-003 + PHASE-004 completion reports,
   the UI doc set (DESIGN_SYSTEM, DESIGN_TOKENS, DESIGN_PRINCIPLES, COMPONENT_CATALOG,
   RTL_DESIGN_RULES, ACCESSIBILITY, MOTION_GUIDELINES), LOCALIZATION_ARCHITECTURE;
   run the docs validator and `pnpm gate:local` before starting.
2. Consume the delivered entry points: the provisional screens (apps/web — 9
   PHASE-003 + 8 PHASE-004 pages), the parity-asserted AR/EN dictionary
   (i18n/dictionaries.ts, 310 keys/locale), the BFF contract, the derived
   entitlements payload (`GET /api/v1/tenancy/entitlements`), and the workspace
   substrate onboarding produced (CoA + purposes + roles + settings).
3. Keep the entitlement settings + permissions surfaces frozen (trust substrate):
   design changes need decision records; restyling screens is the phase's mandate,
   changing their contracts is not.
4. Register any new tenant-owned table in `src/__db__/isolation/tables.registry.ts`
   (unlikely in this phase) and keep `pnpm check:permissions-drift` green.
5. Do NOT implement PHASE-006+ in the same run.

## Follow-up obligations (waived evidence — attach at first infra availability)

- First GitHub CI green run on `main` (ci.yml) — PHASE-001 (local gate output is
  the recorded substitute).
- `docker compose up -d` healthcheck capture on a Docker-capable host — PHASE-001.
- First ci-db.yml (Testcontainers) run — PHASE-002 (the embedded-PG16 db suite is
  the recorded local substitute).

## After PHASE-004 completes

Next eligible: PHASE-005 — Design System, i18n & RTL Foundation. The roadmap
extends to PHASE-034 (post-GA stages 9–11 per
[../EXPANSION_REGISTER.md](../EXPANSION_REGISTER.md)); execution order is unchanged.

## Do NOT

- Do not implement PHASE-006+ in the same run as PHASE-005.
- Do not modify the ADRs or the roadmap without the change-control process
  ([IMPLEMENTATION_PROTOCOL.md](IMPLEMENTATION_PROTOCOL.md) §3).
- Do not relax the frozen substrates (PHASE-002 infra, PHASE-003 identity trust,
  PHASE-004 provisioning/entitlements) to make PHASE-005 easier — changes need
  decision records.
