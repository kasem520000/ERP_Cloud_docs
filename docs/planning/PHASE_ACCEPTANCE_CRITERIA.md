# Phase Acceptance Criteria

> **Status:** STABLE · **Owner:** Platform Architecture · **Updated:** 2026-10-28 — EXP-001 34 phases

Consolidated, objective acceptance criteria and exit gates per phase. The authoritative,
expanded version lives in each phase document's sections 6–8 ("Verification",
"Completion and Handoff"); this file is the reviewable index. **No phase may be marked
COMPLETE unless every item here passes with evidence.**

Universal criteria apply to all phases (from
[../testing/TEST_STRATEGY.md](../testing/TEST_STRATEGY.md) and
[../handoff/IMPLEMENTATION_PROTOCOL.md](../handoff/IMPLEMENTATION_PROTOCOL.md)):

- U1. Typecheck, lint (incl. module-boundary rules), and full test suite green in CI.
- U2. New migrations apply cleanly on a fresh database AND on the staging-shape database
  (migration test); rollback path documented.
- U3. Every new tenant-owned table has tenant scoping + RLS + isolation attack tests.
- U4. Every new route has permission checks + permission tests; rate limits on public ones.
- U5. All money math via shared decimal utilities; no float (lint-enforced).
- U6. UI text bilingual (AR+EN), RTL-correct (visual snapshot AR & EN), a11y checks pass.
- U7. Documentation updated: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md),
  affected domain docs, `CHANGELOG.md`; completion report written with evidence.
- U8. No TODOs / stubs / dead code merged; code review checklist passed.

## Per-phase criteria (must-have highlights)

| Phase | Acceptance criteria (highlights) |
|-------|----------------------------------|
| 001 | Monorepo builds; CI runs typecheck+lint+unit+E2E stub on all apps; Docker Compose boots api+web+pg+minio+mailpit with health checks; boundary lint fails a deliberately violating test file (negative meta-test); docs validation in CI |
| 002 | Drizzle migration framework with named conventions; RLS helpers applied (app role non-owner, `SET LOCAL` GUC pattern, guard triggers); pg-boss boots with test job; storage adapter signed URLs; `/health/ready`; migration tests + RLS presence check in CI; attack tests A1–A10 on infra tables pass |
| 003 | Login/logout/session rotation; argon2id hashing; TOTP enroll/verify + recovery codes; RBAC enforcement matching [../security/AUTHORIZATION_MATRIX.md](../security/AUTHORIZATION_MATRIX.md); audit events for auth + admin actions; **cross-tenant attack suite ≥ 20 scenarios, 0 leaks**; rate limiting + progressive lockout verified |
| 004 | Registration creates tenant + owner + default config (template selected, jurisdiction pack bound, CoA template instantiated); onboarding wizard API complete; branches CRUD + scoping; entitlements service resolves plan→features and blocks disabled features server-side; admin console: suspend/restore (sessions killed, sync rejected), entitlement edit, audit view; support access time-boxed + audited |
| 005 | Design tokens implemented exactly ([../ui/DESIGN_TOKENS.md](../ui/DESIGN_TOKENS.md)) and used by ≥ 20 catalog components; DataTable virtualized at 10k rows with keyboard support; MoneyInput decimal keypad AR/EN; DateRange Gregorian+Hijri; app shell RTL/LTR mirrored with entitlement-driven nav; i18n key-parity CI check (zero missing AR/EN keys); visual regression AR+EN green; Storybook catalog deployed |
| 006 | Partners/items/categories/UoM/barcodes/price lists CRUD + search + import(CSV/XLSX)/export with duplicate detection and dry-run preview; opening-balance drafts stored (not posted); attachments permission-checked; partner credit-check API; UoM conversion property tests; **zero journal rows from module (verified)** |
| 007 | CoA template instantiation bilingual + tree validation (leaf-only posting) + purpose mapping fail-closed; fiscal periods + lock enforced by posting engine; manual journal create→approve→post; **posting engine implements [../accounting/POSTING_ENGINE.md](../accounting/POSTING_ENGINE.md) exactly: validation pipeline 1–8, error taxonomy, idempotency INV-013**; reversal flow; GL drill-down; recurring entries; opening balances posting (CoA + partners); **INV-001…INV-022 initial coverage: each invariant has passing positive + violation tests** |
| 008 | Cash/bank/petty accounts linked to CoA; receipts/disbursements with allocations (incl. opening balances) post correct journals (golden tests); expense claims + approval policies; transfers with charges; cashier shifts with variance; bank statement import + matching; FX difference posting on settlement; treasury balance = GL account (INV-019) |
| 009 | Six treatments modeled distinctly; tax codes resolve per document date with rate snapshots; jurisdiction packs for all 10 countries load + version; **no-VAT pack operates cleanly (documents without VAT fields, no VAT postings, NOT_SUBJECT stamps)**; unregistered-tenant mode; tax summary per document; VAT return report reconciles to GL tax accounts (INV-012) per pack scenario; adapter port + fake adapter contract tests |
| 010 | Stock ledger append-only; WAC + FIFO engines pass property tests vs oracle datasets (incl. multi-receipt/multi-issue sequences); opening stock posting; transfers with in-transit; counts → adjustments post shrinkage/appreciation; batch/expiry/serial/IMEI enforcement where flagged; availability API; **inventory subledger reconciles to GL (INV-010/017/018: move+journal atomicity tests)** |
| 011 | PR→PO→GRN→supplier invoice chain with documented statuses; three-way matching with tolerance policies + match_result recorded; debit notes; payments + allocations; AP aging + supplier statements; GRNI accrual + clearing correct; landed-cost baseline; matching failure paths tested |
| 012 | Quote→order→delivery→invoice→credit note full chain; cash + credit sales; partial payments + allocations; credit limits (block/warn/ignore) enforced server-side at approval; returns re-enter stock at original cost; AR aging + customer statements (deterministic as-of); **all sales/credit-note posting rules tested with expected journal entries (success + failure: credit limit, period lock, stale price)** |
| 013 | Report contract registry per [../reporting/REPORT_CONTRACT.md](../reporting/REPORT_CONTRACT.md); TB/IS/BS/CF correct on golden datasets with self-assertions (TB debits=credits; IS net = BS current-year result); drill-down to source documents; print templates AR/EN RTL-correct; PDF/XLSX/CSV exports byte-stable in tests; permissions per report; exports audited; heavy reports via job path |
| 014 | Plans + entitlement matrix enforced end-to-end (server-side); checkout via provider adapter (sandbox) AND manual invoicing fallback; onboarding UX: register→configure→first invoice journey in AR and EN; dashboards with drill-down; security review of MVP surface (findings triaged); load smoke vs NFR-006; **MVP gate checklist green** ([MASTER_ROADMAP.md](MASTER_ROADMAP.md) §Release gates) |
| 015 | Configuration engine: `resolveEffectiveConfig` deterministic (property tests) + invalidation events; manifests schema-validated; retail/grocery/restaurant templates apply without data corruption; template switching additive-only (reversal of destructive attempts rejected + audited); INV-022 fuzz: configuration attempts cannot alter invariants |
| 016 | POS terminals + shifts/drawer with variance posting; touch sale flow p95 < 2s scan-to-cart; barcode scanning; receipts 80/58mm RTL-correct (visual snapshots); **offline sale queue: sell disconnected → sync reconciles with zero double-posting (chaos slice C-01/03/04/07/09/16)**; end-of-day Z report matches journals; unregistered-mode receipts |
| 017 | Automotive template: job cards (parts + labor) post correctly (golden tests incl. both parts-issue policies); vehicle registry per partner; distribution: van stock = warehouse semantics with load/unload transfers, route visits, settlements (cash + credit + returns + variance reconcile — conservation tests); customer price tiers + free goods |
| 018 | BOM versioning + explosion (multi-level); production order → consumption → WIP → finished goods at computed cost (material+labor+overhead); scrap posting; batch genealogy forward/backward trace; QC gates block completion on fail; **WIP/FG reconcile to GL (INV-010)**; multi-level costing golden tests with scrap % |
| 019 | Leads→customer conversion; tasks/activities/reminders with notifications; service contracts: recurring billing idempotent per (contract, period) incl. boundary dates + period-lock handling; deferred revenue wiring (BR-027); service orders; project dimension usable on documents + reports; revenue schedule ↔ AR reconciliation |
| 020 | Device registry + revocation (pushes rejected, pulls blocked); change feeds with cursors + tombstones; push/pull contracts with typed per-item results; **conflict policies per entity: server-decision for financial (no LWW) — policy tests**; local DB reference implementation + contract version gates; **full chaos matrix C-01…C-16 green** ([../testing/SYNC_TESTS.md](../testing/SYNC_TESTS.md)); POS terminal (PHASE-016) interops with generalized protocol; sync monitoring dashboard |
| 021 | Tauri app builds + signed auto-update (staged rollout path); offline web-ERP in shell: login, cached read models, offline drafts per capabilities matrix; keychain storage; crash recovery preserves outbox; WebView2 min-version enforcement; packaging + updater downgrade/attack tests |
| 022 | Expo app: personal-account views (balance, statement, invoices, receipts, due dates) with offline cache; field sales offline→sync flows; device registration + revocation enforced; biometric unlock; AR/RTL-EN parity snapshots; push notification skeleton; staged rollout + min-version enforcement |
| 023 | **No-fabrication gate**: ZATCA adapter implemented only against pinned official specifications with verification checklist evidence (sandbox exercised, sample invoices validated, legal review); submission registry state machine + retries + alerting; QR/signature verified against official test vectors; fake-authority harness tests (submission, rejection, timeout, retry); payment provider production adapter; **INCOMPLETE status rules honored when gating decisions (OQ-004/DR-001) are open — no silent completion** |
| 024 | Pen test per [../security/SECURITY_TEST_PLAN.md](../security/SECURITY_TEST_PLAN.md) scope executed; findings remediated/closed per SLA; MFA enforcement policies per role/plan; rate-limit/lockout hardening verified; secrets rotation drill executed once; dependency/SBOM triage; audit review tooling; privacy notices legal-review task tracked (OQ-009 decision record) |
| 025 | Load tests at 10× projection meet NFR-006 (k6 evidence, T-01…T-08); soak test; DR drill within RTO with timing evidence (region-loss tabletop + cross-region restore rehearsal); cold backup-restore by second engineer; runbooks cold-run validated; SLO dashboards + error budgets live; docs-drift final validation; **GA gate checklist green** ([MASTER_ROADMAP.md](MASTER_ROADMAP.md) §Release gates) |
| 026 | Asset register with categories + useful life; straight-line/declining/units depreciation posts balanced journals; disposal/revaluation posts correctly; asset count reconciles to GL (INV-010 extended); INV-022 config cannot bypass |
| 027 | Employees/contracts/departments/grades CRUD; payroll elements + runs post net/gross/deductions to GL; GOSI calc per country pack; payslip AR/EN; payroll idempotent per (tenant, period) |
| 028 | Shifts/attendance import + leave workflow + EOS/gratuity accrual posts; loans/advances deducted in payroll; compliance reports |
| 029 | Tier/bulk pricing resolves deterministically; wholesale orders apply correct tier; credit wholesale workflows with aging |
| 030 | Serial/IMEI warranty lookup + expiry; RMA creates adjustment journals; repair ticket consumes parts + posts labor; service contracts bill |
| 031 | Patient/appointment/encounter CRUD; medical invoice links to sales invoice + insurance split; pharmacy dispense decrements stock; HIS Lite reports |
| 032 | Student/class/enrollment/fee structure CRUD; fee invoices post to AR; timetable/results with SIS Lite reports |
| 033 | Farm/crop season/inputs/harvest + livestock/feed; harvest posts to inventory at computed cost; yield reports |
| 034 | 3-entity group with intercompany docs + eliminations produce balanced group TB/IS/BS; consolidation idempotent; hyperscale load at 20× NFR-006 |

## Verification evidence requirements

Every acceptance item must be evidenced by at least one of: CI test names (linked),
command output in the completion report, screenshots for visual criteria (secondary —
data assertions are primary per directive §17), or runbook drill logs. Statements
without evidence do not count. A phase with failing or skipped critical tests is
`IN_PROGRESS` — never `COMPLETE`.
