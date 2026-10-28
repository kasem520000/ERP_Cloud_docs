# ERP Platform — Universal Business ERP (Cloud)

> **Blueprint v1.1 + PHASE-001 Foundation COMPLETE** · MENA/GCC · Arabic-first RTL · Multi-tenant SaaS ERP

[![ci](https://github.com/kasem520000/ERP_Cloud_docs/actions/workflows/ci.yml/badge.svg)](https://github.com/kasem520000/ERP_Cloud_docs/actions/workflows/ci.yml)
[![docs](https://img.shields.io/badge/docs-validated-brightgreen)](./scripts/validate-docs.py)

Modular monolith (NestJS) + Next.js web + Tauri desktop + Expo Android + PostgreSQL (RLS) + shared kernel (`@erp/domain-core`, `@erp/contracts`, `@erp/ui`) orchestrated with pnpm + Turborepo.

**Current state:** Documentation blueprint (202 docs, 17 ADRs, 25 phases) + **PHASE-001 engineering foundation** (monorepo skeleton, strict TS, lint/boundary gates, Docker Compose, CI, domain primitives). See [docs/handoff/CURRENT_STATE.md](docs/handoff/CURRENT_STATE.md) for the honest status and [docs/planning/IMPLEMENTATION_STATUS.md](docs/planning/IMPLEMENTATION_STATUS.md) for the phase table.

---

## 1. Quickstart (cold start — PHASE-001 verified)

```bash
# 1. Clone
git clone https://github.com/kasem520000/ERP_Cloud_docs.git erp-platform && cd erp-platform

# 2. Install workspace dependencies (pnpm workspaces + Turborepo)
pnpm install

# 3. Create your local env file from the committed template — never commit .env
cp .env.example .env

# 4. Start infrastructure (postgres 16, minio, mailpit)
docker compose up -d
docker compose ps  # all services healthy

# 5. Run the app (hot reload): web on http://localhost:3000, api on http://localhost:3001
pnpm dev

# Verify
curl -fsS http://localhost:3001/health/live   # {"status":"ok",...}
open http://localhost:3000/ar                  # RTL demo (locale switch to /en for LTR)
pnpm test                                      # unit + property tests (domain-core, contracts, api)
pnpm typecheck && pnpm lint && pnpm build      # full verification gate
python3 scripts/validate-docs.py               # docs validation (links + phase headings + manifests)
bash scripts/check-boundaries.sh               # negative boundary meta-test
```

Detailed runbook: [docs/operations/DEVELOPMENT_SETUP.md](docs/operations/DEVELOPMENT_SETUP.md) · CI pipeline: [docs/operations/CI_CD.md](docs/operations/CI_CD.md)

## 2. Repository layout (end of PHASE-001)

```
erp-platform/
  apps/
    api/            # NestJS skeleton: AppModule + /health/live (PHASE-001)
    web/            # Next.js skeleton: [locale] segment, dir="rtl"/"ltr" demo
    desktop/        # README stub — implemented in PHASE-021
    mobile/         # README stub — implemented in PHASE-022
  packages/
    contracts/      # zod registry v0 + error-code enum seed
    domain-core/    # UUIDv7, Money/Quantity/Rate (decimal.js), Result, errors, CalendarDate + tests
    ui/             # README stub — implemented in PHASE-005
    config/         # tsconfig bases, eslint base, prettier config
  docs/             # blueprint (202 docs, 17 ADRs, 25 phases)
  scripts/          # validate-docs.py, check-boundaries fixture runner
  docker-compose.yml
  .env.example
  pnpm-workspace.yaml
  turbo.json
  .github/workflows/ci.yml
```

## 3. Scripts (Turborepo)

| Command | What it does |
|---------|--------------|
| `pnpm dev` | `turbo dev` — web + api hot reload |
| `pnpm test` | `turbo test` — unit suites (domain-core property tests, api health) |
| `pnpm lint` | ESLint (boundaries + import + dependency-cruiser) + Prettier |
| `pnpm typecheck` | `tsc --noEmit` strict (no unchecked indexes, no `any`) |
| `pnpm build` | `turbo build` — all packages + apps |
| `pnpm docs:validate` | `scripts/validate-docs.py` — link checker + phase-heading + manifests |
| `docker compose up -d` | postgres:16 + minio + mailpit (api/web via `pnpm dev` or `docker compose --profile full up -d`) |

## 4. Documentation map

| Need | Document |
|------|----------|
| What to build | [docs/implementation/phases/PHASE-001.md](docs/implementation/phases/PHASE-001.md) |
| Why architecture | [docs/architecture/ARCHITECTURE_DECISIONS.md](docs/architecture/ARCHITECTURE_DECISIONS.md) + `ADR/` |
| Business rules | [docs/product/BUSINESS_RULES.md](docs/product/BUSINESS_RULES.md) |
| Accounting | [docs/accounting/POSTING_ENGINE.md](docs/accounting/POSTING_ENGINE.md) |
| Database | [docs/database/DATABASE_CONVENTIONS.md](docs/database/DATABASE_CONVENTIONS.md) |
| API | [docs/api/API_CONVENTIONS.md](docs/api/API_CONVENTIONS.md) |
| UI | [docs/ui/DESIGN_TOKENS.md](docs/ui/DESIGN_TOKENS.md) |
| Testing | [docs/testing/TEST_STRATEGY.md](docs/testing/TEST_STRATEGY.md) |
| Security | [docs/security/AUTHORIZATION_MATRIX.md](docs/security/AUTHORIZATION_MATRIX.md) |

## 5. Implementation protocol

Phases execute **one at a time**, in order, with verification gates. Entry point: [docs/handoff/AGENT_START_HERE.md](docs/handoff/AGENT_START_HERE.md) · Protocol: [docs/handoff/IMPLEMENTATION_PROTOCOL.md](docs/handoff/IMPLEMENTATION_PROTOCOL.md)

- Current: **PHASE-001 COMPLETE** → Next eligible: **PHASE-002 Database & Migration Infrastructure**
- Commit convention: `PHASE-001: <scope> - <change>` + `CHANGELOG.md` entry per phase
- Branch protection: `main` — required checks `install`, `typecheck`, `lint`, `unit`, `build`, `docs-validation`, `gitleaks`, `negative-boundary-test`

## 6. License & ownership

Private — Kasem / ERP Platform. See [docs/CONSOLIDATION_REGISTER.md](docs/CONSOLIDATION_REGISTER.md) for consolidation history.
