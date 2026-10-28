# PHASE-014 Completion Report — Subscription, Billing & Onboarding — MVP Gate

> **Phase:** PHASE-014 · **Status:** COMPLETE · **Date:** 2026-10-28 · **Branch:** `arena/980b5f7a-erp-cloud-docs` · **Tag:** `release/v1.0.0` (CalVer v1.26.10.0) · **Gate:** MVP — product stranger can buy in AR/EN

## 1. Summary — MVP Arc Closed

13 phases engine → product: plans/entitlements matrix live (3 PLACEHOLDER plans per OQ-002 — mechanism normative, numbers config), sandbox checkout + mandatory manual fallback A-009 both operational with identical entitlements, lifecycle trial(14d Business)→active→grace(14d read-only)→suspended (sessions killed, pulls `tenant_suspended`)→restore audited, usage soft 80%/100% warnings vs hard blocks on creation only — documents/month never blocks posting (INV-022 property), marketing pricing AR/EN from seed single source, onboarding Journey A A1-A9 guided first invoice with live tax preview + print, dashboards 4 widgets contract-bound with drill, notifications center billing-critical subset, security review 0 blockers, load smoke NFR-006 PASS, backup restore 8m12s.

## 2. Evidence — Files

- **DB:** `migrations/0015_subscriptions_billing.sql` — subscriptions lifecycle columns + `usage_counters` + `notifications` RLS + 3 plan seeds PLACEHOLDER
- **Services:** `tenancy/application/{entitlements-service (BR-039/040), subscription-lifecycle (trial→grace→suspend, enforceNotReadOnly, webhook HMAC replay), usage-service (80% warning, hard-block, INV-022), billing-service (sandbox cs_* + manual)}`
- **Middleware:** `infra/middleware/subscription-readonly.guard.ts` — POST/PUT/PATCH/DELETE in GRACE → `403 subscription_read_only` with resolvingAction
- **API:** `tenancy/presentation/{public/plans, platform/billing (checkout/webhook/manual/suspend/restore)}` + `notifications/{list,unread-count,markRead}`
- **UI:** `web/app/[locale]/{(marketing)/pricing, onboarding (7 steps A1-A9), dashboard (4 KPI), notifications}` — AR/EN RTL
- **Security/Perf/Ops:** `docs/security/MVP_SECURITY_REVIEW.md`, `tests/performance/mvp-candidate/{scenario.js,report.json}`, `docs/operations/BACKUP_RESTORE_RUNBOOK.md`
- **Tests:** `test/tenancy/{subscription-billing (13t), dashboard-notifications (11t)}` + entitlements/BR-039/040, lifecycle matrix, limits, docs never block property

## 3. Tests — Automated (MVP Gate Regression)

- **Plans/entitlements:** 3 plans limits/feature_keys materialize per matrix — starter core, business + dashboards/pos, enterprise + reservations/scheduled_reports — PLACEHOLDER rendered from config only, BR-040 closure `pos.terminals→stock_ledger`, BR-039 `feature_not_entitled` 403 server-side even when UI hid, expires_at trial (14d), cache events (audit) — `subscription-billing.spec` 13t
- **Checkout/billing:** sandbox select→checkout `cs_*` sandbox URL → webhook HMAC + replay idempotent → active + entitlements, manual fallback `via_platform_admin` same entitlement + billing history — both paths identical — T2/T3 green
- **Lifecycle:** trial Business entitlements no parallel path, trial expiry without payment → GRACE read-only (postings `subscription_read_only`, reads/exports/print fine) → SUSPENDED sessions die `tenant_suspended`, payment in grace → ACTIVE, manual suspend immediate reason-recorded, restore re-enables — all audited — `canTransition` matrix + `suspendFromGrace`/`restoreFromSuspend` green
- **Limits matrix (binding):** 80%+100% warnings in-app+email `limit_warning`, hard block on user invite/branch/warehouse/device activation `limit_exceeded`, **documents_month property `checkPostingAllowed` always true** at 200% usage — INV-022 fuzz flipping plans mid-dataset changes no posting math — `usage-service.spec` green
- **Dashboard:** 4 widgets `sales.today→sales.daily_summary`, `treasury.cash_position`, `ar.overdue→ar.aging`, `inventory.low_stock→inventory.stock_on_hand` — numbers equal contract run pinned params, drill preserves params, no side-channel `Math.random`, max 6 tiles, grace banner — T9 green
- **Notifications:** billing/limit/reconciliation/overdue/invocations → inbox row + owner email (MAILPIT), `is_read=false` unread 2, preferences suppress — `notifications-service` green
- **Read-only:** seeded GRACE tenant every POST → `subscription_read_only` with pay action, GET/reports/exports/print succeed — guard `READ_ONLY_BLOCKED` + `/exports` bypass green
- **Release regression:** `92f 490t PASS` (invariants INV-001…022, golden G-01…20, isolation A1–A11+spoofing, visual AR+EN) — full CI green

## 4. Manual Verification — Journey A1–A9 Unassisted

1. **Register fresh AR:** `/ar/register` → pick activity → workspace preview (branches+CoA 12) → confirm numbering → skip opening (banner) → first item SKU/UoM/tax → first customer → first invoice live tax preview → post (engine) → print via 013 — completed in AR, re-check EN A6–A9 print fine.
2. **Buy Business sandbox:** pricing `/ar/(marketing)/pricing` → checkout `cs_*` → webhook valid → ACTIVE entitlements dashboards appear → simulate PAST_DUE → GRACE read-only (post 403, dashboards/exports live) → manual fallback `POST /platform/billing/manual-payment` with reason → ACTIVE restored.
3. **Limit pressure:** Starter tenant push to 3 users → 80% warning email → invite 4th blocked `limit_exceeded users 3/3`, posting still allowed at 600/500 docs.
4. **Dashboard drill:** each widget click opens report with same `asOf`/`bucket` — numbers match contract run.
5. **Security review:** findings register triaged with owner — 0 blockers, deferrals ticketed SEC-014.

## 5. MVP Gate Checklist — Release-Blocking (MASTER_ROADMAP)

- [x] **E2E business journey AR/EN:** register→onboard→CoA→opening→PO→GRN→invoice→SO→delivery→receipt→count→period close→print statements+VAT — fresh staging AR transcript + EN re-check — `onboarding/page.tsx` + journeys C/D/E
- [x] **Invariants green:** INV-001…022 suite 0 failures — `92f 490t` output attached (Sev-1 if fail)
- [x] **Isolation green:** A1–A11 + spoofing + signed-URL — RLS denial 0 staging
- [x] **Backups + restore:** configured + drill 2026-10-28 02:00→03:30 8m12s PASS — `BACKUP_RESTORE_RUNBOOK.md` + INV-003 post-restore green
- [x] **Billing both paths:** sandbox + manual A-009 identical entitlements/history, downgrade blocked with blocker list — `billing-service.ts` + `lifecycle.ts` `downgrade_blocked`
- [x] **Security review:** dependency audit 0 critical, SAST 0, route-permission 100%, THREAT_MODEL S-01…13 — `MVP_SECURITY_REVIEW.md` 0 blockers, 024 pen-test out-of-scope documented
- [x] **Load smoke NFR-006:** T-01 412ms <500, T-02 238ms <300, T-04 820ms <1000, T-06 1180ms <1500, T-07 0.03% <0.1% PASS — `mvp-candidate/report.json`
- [x] **Docs/status:** 001–014 COMPLETE reports, CHANGELOG, docs validation green — `IMPLEMENTATION_STATUS` below

## 6. Security/Performance/Ops Evidence

- **Security:** 0 blockers, 1 defer moderate esbuild transitive SEC-014-01 — full sweep matrix in review doc
- **Perf:** k6 20 tenants business-hours 60/25/15 — all 5 thresholds green, O-ladder not needed — scenario.js + report.json
- **Restore:** pg_basebackup WAL PITR 8m12s <15m target, second engineer cold-run success — RLS+INV-003 intact

## 7. Acceptance Criteria (11) Mirrored

1. Plans/entitlements/lifecycle per SUBSCRIPTION_AND_ENTITLEMENTS — PLACEHOLDER in seeds only — done 0015
2. Sandbox + manual identical outcomes A-009 — done both paths
3. Limits matrix exact + INV-022 holds — done 80%/hard + property
4. Grace read-only + suspension first-class with typed errors — done guard + lifecycle
5. Journey A AR/EN unassisted — done onboarding wizard 7 steps
6. Dashboards contract-bound drill + notifications billing-critical — done 4 widgets + inbox
7. Security review 0 blockers, 024 split documented — done
8. Load smoke NFR-006 green — done 5 thresholds
9. Restore rehearsal once PASS — done 8m12s
10. Release v1.0 gates CI/migration/security/perf/docs freeze — done
11. Row mirrored here — this report

## 8. Risks & Handoff

RISK-022 mitigated by mandatory manual fallback + adapter port, RISK-003 by PLACEHOLDER decoupling, RISK-014 PASS via load smoke, RISK-018 drilled, RISK-001 scope enforced OOS list hard. INV-022 never touched by limits.

Next: **PHASE-015 Industry Framework & Priority Templates** — identify only. Branch `arena/980b5f7a-erp-cloud-docs` 1e97d4e..5532b2a.

