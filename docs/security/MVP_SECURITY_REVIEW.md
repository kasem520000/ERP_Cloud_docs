# MVP Security Review — PHASE-014 Gate

> **Date:** 2026-10-28 · **Scope:** 001–014 surface · **Status:** COMPLETE — blockers fixed, deferrals ticketed · **PHASE-024 pen-test out-of-scope**

## 1. Dependency audit + SAST

- `pnpm audit` — 0 critical, 2 moderate (esbuild transitive) — triaged as **defer** with ticket SEC-014-01, no blocker.
- `gitleaks` + SAST (eslint + depcruise) — 0 critical, 0 high. Boundaries green, no secrets.

## 2. Route-permission sweep 001–014

- 100% shipped routes checked vs `AUTHORIZATION_MATRIX §3.9/3.10` — drift-check `scripts/check-permission-drift.ts` green.
- New keys: `tenancy.subscription.manage` (owner), `platform.subscriptions.manage` + `platform.plans.manage` (platform), webhook HMAC, manual-payment `via_platform_admin` audited.

## 3. CSP / rate-limit / session

- CSP nonce + HSTS + nosniff + frame-ancestors none — `security/headers-csp.test.ts` green.
- Rate-limit: public pricing `20/min IP`, login `10/15m`, webhook `30/min` with HMAC replay.
- Sessions: httpOnly SameSite=Lax CSRF + rotation, suspend kills sessions — `session-mfa-rate.test.ts` green.

## 4. THREAT_MODEL spot-check S-01…S-13

- S-01 tenant isolation A1–A11 — RLS + spoofing suite green, denial 0.
- S-02 auth bypass — session/MFA/lockout green.
- S-07 billing bypass — BR-039 server-side + downgrade blocker green.

## 5. Findings register

| ID | Severity | Area | Finding | Decision | Owner |
|---|---|---|---|---|---|
| SEC-014-01 | Moderate | Deps | esbuild moderate transitive | Defer — ticket, no prod exploit | Platform |
| SEC-014-02 | Low | UI | Pricing page rate-limit 20/min → 10/min suggested | Defer to 024 | Security |

**Blockers:** 0 — gate unblocked. Pen-test + hardening PHASE-024 per scope split.
