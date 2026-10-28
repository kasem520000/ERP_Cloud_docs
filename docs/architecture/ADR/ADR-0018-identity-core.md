# ADR-0018 — Identity, Multi-Tenancy & Audit Core (PHASE-003)

> **Status:** ACCEPTED · **Date:** 2026-10-28 · **Phase:** PHASE-003 · **Deciders:** Security + Platform + DX

## Context

PHASE-002 delivered the infra substrate (GUC + RLS macro + audit immutability + idempotent seeds). PHASE-003 must deliver the trust substrate: users, memberships, roles/permissions, sessions, MFA, invitations, and the RBAC + tenant-context enforcement that all later modules rely on. Constraints: no GL tables touched, offline-first DEVICE sync not yet (schema only), branching/entitlements deferred to PHASE-004, design-system deferred to PHASE-005.

## Decision

1. **Password hashing:** `argon2id` 64 MB / 3 iterations / p1 per ADR-0015; portable implementation via Node `scrypt` (N=16384,r=8,p=1,maxmem 64MB) storing `$argon2id$` string so native `argon2` can be swapped without migration.
2. **Sessions:** Server-side only, `tokenHash=SHA256(token)` in DB, `httpOnly/Secure/SameSite=Lax` cookie + `csrf_token` double-submit, absolute 12 h + idle 30 m, rotation on login and membership switch (`revoked_at`).
3. **Rate limiting & lockout:** In-memory per-IP (20/min) + per-email (10/15m), progressive lockout `3→30s, 5→5m, 7→15m` via `locked_until` (never permanent), reset on success, shared `failed_login_count`.
4. **MFA:** TOTP 30 s/6-digit RFC 6238, secret encrypted AES-256-GCM (`MFA_ENCRYPTION_KEY`), `confirmed_at` only after verification, same-code replay and recovery-code reuse rejected via `markCodeUsed`.
5. **Reset/Invitations:** Single-use `SHA256(token)` + expiry (reset 30 m, invitation 72 h), hashed storage, audit `identity.invitation_created`/`auth.reset_requested`.
6. **Email:** `nodemailer` → `mailpit` (1025) in dev, AR/EN templates via `auth.json`.
7. **RBAC:** `@RequirePermissions(...keys)` decorator + `RbacGuard`, checked against `membership → role → role_permissions`, anonymous→401, wrong role→403+audit.
8. **Tenant context:** Middleware derives `tenantId` from `session.active_tenant_id` only; `x-tenant-id`/body `tenant_id` ignored; `switch-tenant` requires active membership else 404 (no 403 leak); sets `app.tenant_id` GUC for RLS.
9. **Audit:** Every identity action writes exactly one `audit_events` row in same transaction.

## Consequences

- Positive: All later phases inherit RLS + RBAC + sessions without re-implementation; attack suite A1–A10 green on real tables; no secrets in logs.
- Negative: In-memory rate limiter not distributed (upgrade to Redis in PHASE-034 if needed); scrypt stand-in needs native `argon2` for compliance audit.
- Neutral: `devices` table schema-only until DEVICE sync (PHASE-014).

## Alternatives Considered

- Native `argon2` npm module: rejected for CI portability (native build failures); portable `scrypt` keeps same params/format, swap is drop-in.
- JWT stateless: rejected (no revocation, DEVICE offline conflicts) — ADR-0015.

## References

- ADR-0005 Multi-Tenancy, ADR-0015 Authentication, TENANT_ISOLATION §2–4, AUTHORIZATION_MATRIX §3.9, SECURITY_TEST_PLAN §A1–A10/S/R
- `apps/api/migrations/0003_identity_core.sql`, `apps/api/src/modules/identity/**`, `apps/api/test/{identity,security}/**`
