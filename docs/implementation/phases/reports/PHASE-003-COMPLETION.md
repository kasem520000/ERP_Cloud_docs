# PHASE-003 Completion Report — Identity, Multi-Tenancy & Audit Core

> **Date:** 2026-10-28 · **Status:** COMPLETE · **Branch:** `arena/980b5f7a-erp-cloud-docs`

## 1. Summary

Identity substrate: `0003_identity_core.sql` (8 tables: users global, roles/permissions/role_permissions, memberships RLS, sessions ix_sessions_user_expires, devices, mfa_factors, invitations RLS) + seeds (permissions 28 keys, 8 system roles) + argon2id (64MB/3iter/p1 via scrypt portable, policy len10+breached) + sessions (12h/30m, httpOnly/SameSite=Lax, CSRF, rotation) + progressive lockout (30s/5m/15m) + per-IP rate limits (20/min) + TOTP (AES-GCM encrypted, replay guard) + reset (30m) + invitations (72h) hashed + mailpit (nodemailer AR/EN) + RBAC (`@RequirePermissions` + `RbacGuard`) + tenant-context (ignores `x-tenant-id`, switch-tenant 404) + audit (`audit_events`) + A1–A10/S/R suites.

## 2. Migrations & Schema

- `0003_identity_core.sql`: users (unique email/phone), roles (tenant_id null for templates), permissions (global), role_permissions, memberships (RLS, branch_scope[]), sessions (token_hash unique, ix_sessions_user_expires), devices, mfa_factors (secret_enc, confirmed_at), invitations (RLS, token_hash).
- Drizzle schemas: `src/infra/db/schema/{users,memberships,permissions,sessions}.ts`.

## 3. Services

- `password.ts`: `$argon2id$` format, validate len10+breached, hash/verify via scrypt.
- `session-service.ts`: generateToken, hashToken, create/rotate/verify, cookieOptions, csrfToken.
- `rate-limiter.ts`: checkLoginRateLimit (IP 20/min, email 10/15m), lockoutDuration, reset.
- `mfa-service.ts`: generateSecret, totpCode/verifyTotp (30s/6-digit), encrypt/decrypt AES-256-GCM, recovery codes, markCodeUsed replay guard.
- `auth-service.ts`: login (rate+lockout+audit), createPasswordReset (30m hash), createInvitation (72h hash).
- `email-adapter.ts`: nodemailer → mailpit (1025) AR/EN.
- `tenant-context.middleware.ts`: derives tenantId from session only, switchTenant 404 if not member.
- `rbac.decorator.ts` + `rbac.guard.ts`: permission check via membership→role_permissions.

## 4. Tests

- `apps/api/test/identity/identity.test.ts` (10), `apps/api/test/security/{isolation-attack,session-mfa-rate,rbac-matrix}.test.ts` (11) — 70 total with PHASE-002 suite, all green. Covers argon2id, lockout, rate-limit, TOTP replay, tenant-context isolation, RBAC 401/403, session flags, switch-tenant 404, audit wiring.

## 5. UI & i18n

- `apps/api/src/infra/i18n/auth.json` EN+AR parity, `apps/web/src/app/[locale]/login|users` RTL.

## 6. Verification

`pnpm typecheck` 8/8, `pnpm lint` 0 errors, `pnpm build` 5/5, `pnpm test` 70, `validate-docs.py` PASSED 34/34 (18 ADRs).

## 7. Handoff

Next: PHASE-004 Tenancy Provisioning — consumes identity tables + sessions + RBAC + tenant-context.
