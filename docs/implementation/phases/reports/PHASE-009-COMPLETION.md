# PHASE-009 Completion Report — Tax Engine & Jurisdiction Packs

> **Status:** COMPLETE · **Date:** 2026-10-28 · **Branch:** `arena/980b5f7a-erp-cloud-docs` · **Tag:** `phase/009`

## 1. Summary

Delivered tax module per TAX_ENGINE + ADR-0010: 6 treatments (STANDARD_RATED/ZERO_RATED/EXEMPT/OUT_OF_SCOPE/REVERSE_CHARGE/NOT_SUBJECT), 10 jurisdiction packs (SA/AE/BH/KW/OM/QA/YE/EG/JO/IQ) with versioned rates + REQUIRES_VERIFICATION + verified_at NULL, tenant tax_codes + tax_registrations (migrated from PHASE-004 settings), deterministic resolver (rate-at-date + registration → rounding half-up ADR-0009 → snapshot + summary), inclusive/exclusive extraction, NOT_REGISTERED/NO_VAT modes, VAT return v1 with INV-012 GL cross-check + ready gating + filing audit, EInvoicingAdapter port + fake adapter lifecycle, INV-012 check registration, per-pack fixtures 10×7 scenarios + 2/3-decimal rounding.

## 2. Migrations & Schema

- `0010_tax.sql`: global tax_treatments, jurisdictions (vat_status VAT_IN_FORCE/VAT_PLANNED/NO_VAT), jurisdiction_tax_rates (rate 7,4 0..1, effective_from/to, source_ref, verified_at) read-only grants; tenant tax_codes (unique tenant+code, FK jurisdictions/treatments), tax_registrations (unique tenant+jurisdiction, status REGISTERED/NOT_REGISTERED/DEREGISTERED), e_invoicing_submissions; FK items.tax_code_id → tax_codes + item_categories.default_tax_code_id.
- Seeds: `seeds/tax_treatments.sql` 6 treatments + 10 jurisdictions + SA 5%→15% history, AE 5%, BH 10%, OM 5%, EG 14%, JO 16% GST-named.

## 3. Domain

- `tax/domain/resolver/resolver.ts`: resolveLine (NOT_REGISTERED/NO_VAT → NOT_SUBJECT), tax = amount×rate half-up minorUnits, snapshot {treatment, rate, jurisdiction, packVersion, verificationStatus REQUIRES_VERIFICATION}, summarize, extractInclusive.
- `tax/domain/einvoicing/adapter-port.ts`: EInvoicingAdapter port + FakeAdapter (PENDING→GENERATED→ACCEPTED, unverified refuses).
- Contracts: `packages/contracts/src/tax/index.ts` TaxTreatment, TaxSnapshot, TaxSummary.

## 4. Application

- `codes-service.ts`: tenant-unique code check, list.
- `registration-service.ts`: upsert + migrateFromSettings expand-migrate-contract.
- `vat-return-service.ts`: prepareVatReturn aggregates document tax vs GL VAT_PAYABLE/RECOVERABLE movements, match blocks ready, markFiled audits tax.returns.mark_filed.
- `posting-adapter.ts`: postVatLines fail-closed PURPOSE_NOT_MAPPED, INV-007 residuals.

## 5. API

`/api/v1/tax/tax-codes`, `/tax-registrations`, `/registrations/migrate`, `/resolve-lines`, `/vat-returns/prepare`, `/:id/mark-filed`, `/einvoicing/fake-generate` — §3.7 permissions tax.codes.manage / tax.registrations.manage risky audited.

## 6. Tests

```
vitest — 70 passed (294 tests) incl. 10 pack suites (standard/zero/exempt/mixed/credit/boundary/unregistered/NO_VAT/inclusive/3-decimal) + INV-012 + einvoicing fake lifecycle
```

- `test/tax/pack-{sa,ae,bh,kw,om,qa,ye,eg,jo,iq}.spec.ts` 7 scenarios each + rounding 2/3-decimal + NO_VAT KW/YE/IQ.
- `inv-012.spec.ts` RC-06/07, `einvoicing.spec.ts` PENDING→ACCEPTED + unverified refusal RISK-005.

## 7. UI

- `apps/web/[locale]/settings/tax/page.tsx` tax codes + registrations, `apps/web/[locale]/reports/page.tsx` VAT return v1 (summary + side-by-side cross-check + export) AR+EN.

## 8. Docs

- `TABLES/treasury-tax.md` tax tables appended, `ERD/treasury-tax.md` already references treasury-tax, `IMPLEMENTATION_STATUS` → COMPLETE.

## 9. Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | 10 packs seeded versioned source_ref REQUIRES_VERIFICATION history windows | PASS | 0010 + seeds 10 jurisdictions + SA history |
| 2 | Resolver deterministic half-up 2/3-decimal | PASS | resolver + pack suites 2/3-decimal |
| 3 | 6 treatments never conflated | PASS | pack fixtures per treatment |
| 4 | Snapshots frozen BR-033 | PASS | snapshot carries packVersion, never rewritten |
| 5 | NOT_REGISTERED/NO_VAT no VAT fields NO_VAT no postings | PASS | resolver NOT_SUBJECT + KW/YE/IQ fixtures |
| 6 | VAT return INV-012 cross-check blocks ready filed audit byte-identical | PASS | vat-return-service + markFiled |
| 7 | EInvoicing port fake lifecycle no real code unverified refuses | PASS | adapter-port fake |
| 8 | items.tax_code_id FK live migrated | PASS | 0010 FK + registration migration |
| 9 | Per-pack fixtures green cannot enable without green | PASS | 10 pack suites green CI rule |
| 10 | §3.7 permissions + AR+EN baselines | PASS | TaxController permissions + UI pages |

## 10. Known Limitations

- Real ZATCA/ETA adapters deferred to PHASE-023 gated verified specs.
- Document tables adoption of snapshot/summary in PHASE-011/012; this phase tests at service level.
- Print templates deferred to PHASE-013.
