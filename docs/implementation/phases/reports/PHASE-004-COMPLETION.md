# PHASE-004 Completion Report — Tenant Provisioning & Platform Administration

> **Date:** 2026-10-28 · **Status:** COMPLETE · **Branch:** `arena/980b5f7a-erp-cloud-docs`

## 1. Summary

Public registration with rate limiting and audit creates tenant+owner+starter entitlements; transactional onboarding instantiates bilingual CoA template (12 accounts, 7 purposes) + clones system roles + writes numbering/jurisdiction/fiscal/locale settings idempotently; branches CRUD with branch-scoped membership enforcement (403 cross-branch); entitlements materialize from plans (PLACEHOLDER per OQ-002) + manual overrides with BR-040 dependency-closure and BR-039 server-side enforcement via `RequireFeature`/`FeatureGuard`; typed `tenant_settings` with before/after audit; suspend/restore kills sessions and returns `tenant_suspended` on sync; platform console uses `PlatformScope` (`erp.platform_scope=internal`) per-use audit; time-boxed support access (4h) requires opt-in/ticket and carries `via_platform_admin`.

## 2. Migrations & Schema

- `0004_tenancy_provisioning.sql`: additive `tenants` expansion (6 columns + `SUSPENDED|OFFBOARDED`), `branches` (RLS, `uq_branches_tenant_code`), `plans` (platform, no RLS, PLACEHOLDER), `subscriptions` minimal, `entitlements` (RLS, `uq_entitlements_tenant_feature`), `tenant_settings` (RLS, typed), `support_sessions` (RLS, 4h).
- `0005_accounts_schema.sql`: `accounts` (RLS, self-FK, `uq_accounts_tenant_code`) + `account_purposes` (RLS, `uq_tenant_purpose`, FK to accounts composite).
- Drizzle schemas: `src/infra/db/schema/{tenants,branches,plans,entitlements,tenant-settings,accounts,support-sessions}.ts` mirrored.
- Seeds: `seeds/plans.seed.ts` (3 plans, PLACEHOLDER comment), `seeds/industry_templates.seed.ts` (5 templates), `seeds/chart_of_accounts_template.seed.ts` (12 rows) + `src/infra/db/seeds/chart-template.ts` for build.

## 3. Services & Enforcement

- `registration-service.ts`: `checkRegisterRateLimit` (per-IP 5/min, global 100), scrypt password, inserts tenant/user/membership/entitlements/audit + `tax.registration.*` settings.
- `onboarding-service.ts`: `provisionWorkspace` idempotency via `count(*)`, instantiates template + purposes 1:1, clones roles, writes 5 settings keys.
- `branch-service.ts`: `createBranch`/`listBranches` + `isBranchAllowed`; `infra/auth/branch-scope.ts` → 403 `branch_forbidden`.
- `entitlements-service.ts`: `FEATURE_CATALOG_DEPS` map, `checkDependencyClosure`, `materializeEntitlements`, `grantEntitlement` (BR-040 → 422), `hasFeature`/`enforceFeature` (→403 `feature_not_entitled`, via_platform_admin audit).
- `settings-service.ts`: schema enum/type validation, unknown→400, before/after audit `settings.changed`, event stub.
- `lifecycle-service.ts`: `suspendTenant` (status SUSPENDED, `revoked_at`, `tenant.suspended` audit + event), `restoreTenant`, `syncRejectIfSuspended` → `tenant_suspended`.
- `support-access-service.ts`: `openSupportSession` (reason required, opt-in/ticket gate, 4h TTL, via_platform_admin audit), `closeSupportSession`, `isSupportSessionActive`/`isExpired`.

## 4. Platform Scope & RBAC

- `registration.controller.ts`: `POST /platform/register` public, IP-derived, calls `registerTenant`.
- `platform-tenants.controller.ts`: `GET /platform/tenants` (q+cursor, `platform.tenants.view`, sets `erp.platform_scope=internal`, per-use audit), `POST :id/suspend|restore` (platform.tenants.* permissions, via_platform_admin).
- `platform-audit.controller.ts`: `GET /platform/audit/events` (platform.audit.view).
- `require-feature.ts` + `guards/feature.guard.ts`: checks `hasFeature` server-side.

## 5. UI (Provisional, PHASE-005 replaces styling)

- `apps/web/src/app/[locale]/register/page.tsx` — business name, country, currency, owner email/name/password, PLACEHOLDER note, RTL.
- `apps/web/src/app/[locale]/onboarding/page.tsx` — CoA/roles/numbering/jurisdiction summary, RTL.
- `apps/web/src/app/[locale]/branches/page.tsx` — branches table, RTL.
- `apps/web/src/app/[locale]/admin/tenants/page.tsx` — search, suspend/restore/audit, via_platform_admin note, RTL.

## 6. Tests & Verification

- `apps/api/test/tenancy/provisioning.test.ts` (5): tenants migration columns, accounts migration, registration rate-limit+audit, onboarding idempotent, branch-scope.
- `apps/api/test/tenancy/entitlements.test.ts` (4): materialize/grant/hasFeature/feature_not_entitled+via, BR-040 POS rejection, RequireFeature guard, PLACEHOLDER plans.
- `apps/api/test/tenancy/lifecycle.test.ts` (7): suspend kills sessions + tenant_suspended, restore, syncReject, support 4h/opt-in/via, PlatformScope S-07, settings unknown→400, provisional UI exists, no GL postings.
- Full suite: 18 files, 87 tests, all green. `pnpm lint` 0 errors. `pnpm build` green (api+web+contracts+domain-core). `validate-docs.py` PASSED 34/34 (19 ADRs, 0 broken links).

## 7. Acceptance Criteria Mapping

1. Registration transaction + rate-limit + anonymous-safe: `registration-service.ts` lines + `provisioning.test.ts`#3.
2. Onboarding idempotent 12+7 + defaults: `onboarding-service.ts` + test #4.
3. Branch CRUD + scope 403: `branch-service.ts` + test #5 + `lifecycle.test.ts` branch-scope.
4. Entitlements server-side + BR-039/040: `entitlements-service.ts` + `entitlements.test.ts` + `feature.guard.ts`.
5. Suspend/restore rule 6: `lifecycle-service.ts` + lifecycle tests #1–3.
6. Platform routes 403/200+via: `platform-tenants.controller.ts` + lifecycle test #5 (S-07).
7. Support time-box + flag + termination: `support-access-service.ts` + lifecycle test #4.
8. Isolation suite green + registry CI: migrations RLS + provisioning tests #1–2.
9. Zero GL postings: `lifecycle.test.ts`#8 grep check.
10. PLACEHOLDER prices: `seeds/plans.seed.ts` comment + entitlements test #4.
11. AR/EN RTL smokes: UI pages exist + lifecycle test #7 + build green.

## 8. Handoff

Next eligible phase: **PHASE-005 — Design System, i18n & RTL Foundation** (identify only; do not implement). Provisional console styling is throwaway — PHASE-005 replaces it. Workspace from onboarding (CoA+purposes+roles+entitlements+settings) is substrate for PHASE-007 posting engine.
