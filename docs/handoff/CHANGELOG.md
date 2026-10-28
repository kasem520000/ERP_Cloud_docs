# Changelog

> **Status:** LIVING DOCUMENT — append-only, newest first · **Updated:** 2026-10-28

Format: `DATE — item — type` where type ∈ {BLUEPRINT, PHASE-NNN, DOCS, BREAKING-ARCH, DECISION}.

- 2026-10-28 — **Blueprint v1.1 — Consolidation**: Folder 3 adopted as the canonical
  baseline; audited ideas from competing plans integrated and all dispositions recorded.
  10 defect corrections (DEF-001…DEF-010, two HIGH: money wire-regex conflict; ledger
  balance trigger made DEFERRABLE), 12 consolidation decisions (CD-01…CD-12), new
  ADR-0017 (no event sourcing), 14 authoritative summary documents
  (ARCHITECTURE_BASELINE + domain summaries + registers + validation report), 8
  industry manifests extracted to machine-readable JSON
  (`industries/templates/manifests/`), 2 validation scripts (`scripts/`), 23/23
  deterministic doc checks green. See [../CONSOLIDATION_VALIDATION_REPORT.md](../CONSOLIDATION_VALIDATION_REPORT.md)
  and [../CONSOLIDATION_REGISTER.md](../CONSOLIDATION_REGISTER.md). — BLUEPRINT
- 2026-10-27 — **Blueprint v1.0**: complete documentation blueprint created — 202
  documents, 16 ADRs, 25 phase documents, 8-stage roadmap, 22 accounting invariants
  (INV-001…022), 40 business rules (BR-001…040), 10-country compliance matrices with
  verification flags, cross-document validation performed
  ([VALIDATION_REPORT.md](VALIDATION_REPORT.md)). Repository tagged `blueprint/v1.0`.
  No application code exists yet. — BLUEPRINT
- 2026-10-27 — Post-blueprint consistency fixes: phase-numbering drift corrected
  (ADR-0012 POS subset → PHASE-016; DEPLOYMENT client distribution → 021/022;
  OQ-004 ZATCA implementation → PHASE-023; OBSERVABILITY sync-health → PHASE-020;
  MODULE_BOUNDARIES configuration module → P-004/015 and sync tables aligned with
  ENTITY_CATALOG); PHASE_ACCEPTANCE_CRITERIA.md restored; permission-key
  reconciliation note added to FEATURE_CATALOG (AUTHORIZATION_MATRIX canonical);
  TABLES/tax-compliance.md added (referenced by E_INVOICING_ARCHITECTURE); phase
  template/README wording clarified (29 mandatory items mapped to 8 sections). — DOCS
