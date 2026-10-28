# ADR-0019 — Tenant Provisioning & Platform Administration (PHASE-004)

> **Status:** ACCEPTED · **Date:** 2026-10-28 · **Phase:** PHASE-004 · **Deciders:** Platform + Security + Product

## Context

PHASE-003 delivered identity (users/memberships/roles/sessions/MFA). PHASE-004 must make the platform operable: public registration → workspace provisioning (CoA template, roles, numbering, jurisdiction, fiscal preference), branches with branch-scoped membership, entitlements resolved from plans + manual overrides with BR-039/040 enforcement, tenant_settings typed store, suspend/restore with session kill + sync rejection, and platform console + time-boxed support access (RISK-003/010).

## Decision

1. **Migrations additive:** `0004` expands `tenants` (name_ar, base_currency, country_code, timezone, industry_template_key, deleted_at) + status `ACTIVE|SUSPENDED|OFFBOARDED`; creates `branches`, `plans` (platform-level, no RLS), `subscriptions` minimal, `entitlements` materialized, `tenant_settings` typed KV, `support_sessions` (4h default). `0005` creates `accounts` + `account_purposes` (tenant RLS, composite FK, leaf-only posting enforced in PHASE-007).

2. **Registration:** Public `POST /platform/register` rate-limited (per-IP 5/min + global), validates len≥10, creates tenant + owner user (argon2id) + membership (owner template) + starter entitlements + audit `tenant.created`/`membership.created` + provisional `tax.registration.*` settings.

3. **Onboarding `provisionWorkspace`:** Idempotent — if accounts exist skip; else instantiates 12-account bilingual template (with purpose markers 1:1), clones system roles as tenant roles, writes numbering/jurisdiction/fiscal/locale settings; re-run diff-free.

4. **Branches:** CRUD + `branch_scope` uuid[] on membership; `assertBranchScope` → 403 if cross-branch; inactive branches block new docs at service layer.

5. **Entitlements:** `plans` seed starter/business/enterprise (PLACEHOLDER per OQ-002, values not shown); `materializeEntitlements` + `grantEntitlement` with BR-040 dependency-closure check (`pos.*` requires `platform.branches` etc.); `enforceFeature` → 403 `feature_not_entitled`; UI derived-only; `RequireFeature` decorator + `FeatureGuard` at module load + per action.

6. **Tenant settings:** Schema-validated keys (unknown→400, enum check), before/after audit `settings.changed`, invalidation event `tenant.updated`/`settings.changed`.

7. **Lifecycle:** `suspendTenant` sets `SUSPENDED`, kills sessions (`revoked_at`), rejects sync `tenant_suspended`, audited `tenant.suspended` via_platform_admin; `restoreTenant` → ACTIVE.

8. **Support access:** Requires `platform.support.access` + opt-in or ticket, 4h TTL, `expires_at` checked every action, `via_platform_admin` on every audit, tenant can close, trail visible to owner.

9. **Platform console:** `GET /platform/tenants` (q+cursor, PlatformScope `erp.platform_scope=internal`, per-use audit), `POST /:id/suspend|restore`, `GET /platform/audit/events` — all `platform.*` permission-gated (403 without).

## Consequences

- Positive: Registration→onboarding→branch→entitlement→console works AR/EN RTL, isolation suite green on 6 new tenant tables, state-machine abuse tests (suspend/restore loop, escalation, S-02/S-07) green, no GL postings.
- Negative: In-memory rate limiter not distributed; billing/period logic minimal until PHASE-014.
- Neutral: CoA purpose mapping lives but posting engine arrives PHASE-007.

## Alternatives Considered

- JWT suspension via blocklist: rejected — server-side sessions already kill immediately.
- Pricing values real: rejected — OQ-002 pending, PLACEHOLDER prevents premature pricing UX.

## References

- ADR-0005/0006/0008/0010/0015, TABLES/tenancy-identity, CHART_OF_ACCOUNTS §3, FEATURE_CATALOG, SUBSCRIPTION_AND_ENTITLEMENTS, BUSINESS_RULES BR-039/040, MULTI_TENANCY §3 rule 6, TENANT_ISOLATION, AUTHORIZATION_MATRIX §3.10/§7, SECURITY_TEST_PLAN PHASE-004 row.
- `migrations/0004/0005`, `seeds/plans|industry_templates|chart_of_accounts_template`, `modules/tenancy/**`, `infra/auth/*`
