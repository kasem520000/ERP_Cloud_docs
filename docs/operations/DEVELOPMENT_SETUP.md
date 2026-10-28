# Development Setup

> **Status:** STABLE · **Owner:** Platform Operations · **Updated:** 2026-10-27

Local development environment runbook for the Universal Business ERP Platform. It takes a
new engineer or AI agent from a clean clone to a running stack: database, object storage,
mail catcher, API, web, and worker. The quickstart below is a **release acceptance
criterion** of PHASE-001 ("a new developer can run the quickstart cold" —
[../implementation/phases/PHASE-001.md](../implementation/phases/PHASE-001.md) §6); if
reality drifts from this file, fixing the doc or the code is part of the phase exit.

## 1. Prerequisites

| Tool | Version | Why | Check |
|------|---------|-----|-------|
| Node.js | 22 LTS+ | api (NestJS), web (Next.js), tooling ([ADR-0002](../architecture/ADR/ADR-0002-typescript-monorepo.md)) | `node -v` |
| pnpm | 9+ | workspace package manager | `pnpm -v` |
| Docker Desktop | 4.x with Compose v2 | postgres/minio/mailpit services; Testcontainers in CI and locally | `docker compose version` |
| git | 2.40+ | trunk-based flow, hooks | `git --version` |
| PostgreSQL client tools | 16 (`psql`, `pg_dump`) | DB inspection, backup drill exercises ([BACKUP_RESTORE_RUNBOOK.md](BACKUP_RESTORE_RUNBOOK.md)) | `psql --version` |

Use `nvm`/`fnm` (or equivalent) to pin Node 22; a mismatched Node version is the most
common cold-start failure.

## 2. Quickstart (cold start)

```bash
# 1. Clone
git clone <repo-url> erp-platform && cd erp-platform

# 2. Install workspace dependencies (pnpm workspaces + Turborepo)
pnpm install

# 3. Create your local env file from the committed template — never commit .env
cp .env.example .env

# 4. Start infrastructure + app skeletons (postgres 16, minio, mailpit, api, web)
docker compose up -d

# 5. Apply migrations (first run: bootstrap creates the erp_migrate/erp_app roles,
#    then every run applies pending migrations as erp_migrate — PHASE-002)
pnpm --filter api db:migrate

# 6. Seed dev data: reference seeds (currencies, permissions catalog, jurisdiction
#    packs, plans) arrive via migrations; the dev seed adds a demo tenant + admin user
pnpm --filter api db:seed

# 7. Run the app (hot reload): web on http://localhost:3000, api on http://localhost:3001
pnpm dev
```

Verify the stack:

```bash
curl -fsS http://localhost:3001/health/live   # {"status":"ok", ...}
curl -fsS http://localhost:3001/health/ready  # DB + queue checks (PHASE-002+)
docker compose ps                             # all services healthy
```

The worker is the **same image/process entrypoint** with `WORKER_MODE=1`
([../architecture/DEPLOYMENT_ARCHITECTURE.md](../architecture/DEPLOYMENT_ARCHITECTURE.md)).
In development run it as a second process when exercising jobs:

```bash
pnpm --filter api dev:worker        # WORKER_MODE=1, consumes pg-boss queues
```

## 3. Local service map (docker compose)

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `postgres` | `postgres:16` | 5432 | Dev database `erp_dev`; roles `erp_migrate` / `erp_app` / `erp_readonly` created by migration `0001` (PHASE-002) |
| `minio` | `minio` | 9000 (S3 API), 9001 (console) | S3-compatible storage for the `files` module; dev stand-in for managed object storage |
| `mailpit` | `mailpit` | 1025 (SMTP), 8025 (web UI) | Catches all outbound email (invitations, notifications — A-008) |
| `api` | built locally | 3001 | NestJS app ([ADR-0003](../architecture/ADR/ADR-0003-nextjs-nestjs.md)) |
| `web` | built locally | 3000 | Next.js BFF + UI |

Optional profile: `docker compose --profile worker up -d` runs a containerized worker for
testing job behavior closer to production topology.

## 4. Dev scripts (Turborepo tasks)

| Command | What it does |
|---------|--------------|
| `pnpm dev` | `turbo dev` — web + api with hot reload |
| `pnpm --filter api dev:worker` | API package in worker mode (`WORKER_MODE=1`) |
| `pnpm test` | `turbo test` — unit suites across packages |
| `pnpm test:integration` | Testcontainers-based DB tests (PHASE-002+; needs Docker) |
| `pnpm lint` | ESLint (+ module boundary rules + import rules) + Prettier + dependency-cruiser |
| `pnpm typecheck` | `tsc --noEmit` across all packages (strict base config) |
| `pnpm build` | `turbo build` — all packages + apps |
| `pnpm --filter api db:generate` | `drizzle-kit generate` — draft SQL migration from schema changes (hand-edit after; see [../database/MIGRATION_STRATEGY.md](../database/MIGRATION_STRATEGY.md)) |
| `pnpm --filter api db:migrate` | Apply pending migrations sequentially (as `erp_migrate`) |
| `pnpm --filter api db:seed` | Apply dev seed data (dev only — never runs against staging/prod) |
| `pnpm --filter api db:studio` | Drizzle Studio schema browser (read-only habits encouraged) |
| `pnpm docs:validate` | `scripts/validate-docs.py` — link checker + phase-heading + catalog drift hook |

## 5. Environment variables (`.env.example` pattern)

Environment is the **only** configuration source (see
[ENVIRONMENT_CONFIGURATION.md](ENVIRONMENT_CONFIGURATION.md)). `.env` is git-ignored;
`.env.example` is the committed, reviewed template (PHASE-001 T7). Gitleaks runs in CI and
rejects any secret committed to the repo.

| Variable | Dev example | Used by | Notes |
|----------|-------------|---------|-------|
| `DATABASE_URL` | `postgresql://erp_app:erp_app@localhost:5432/erp_dev` | api, web BFF, worker | Runtime role — RLS applies ([../database/TENANT_ISOLATION.md](../database/TENANT_ISOLATION.md)) |
| `MIGRATE_DATABASE_URL` | `postgresql://erp_migrate:…@localhost:5432/erp_dev` | drizzle-kit, deploy migrate job | Migration-only role; never used at runtime |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `erp_dev` / `erp_dev` / `erp_dev` | compose provisioning | First-run bootstrap superuser; not used by the app after `0001` |
| `SESSION_SECRET` | random 32+ bytes | api | Cookie/session signing ([ADR-0015](../architecture/ADR/ADR-0015-authentication.md)) |
| `S3_ENDPOINT` / `S3_REGION` | `http://localhost:9000` / `us-east-1` | files module | MinIO locally; managed storage in staging/prod |
| `S3_BUCKET` | `erp-dev` | files module | Created by seed; per-environment bucket in staging/prod |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | MinIO root keys (dev) | files module | Signed-URL issuance |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | dev values | compose provisioning | MinIO console login at http://localhost:9001 |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | notifications | Mailpit locally; real provider in prod (A-008) |
| `SMTP_FROM` | `ERP Dev <dev@localhost.test>` | notifications | From-address for outbound mail |
| `PUBLIC_WEB_URL` | `http://localhost:3000` | api | Absolute links in emails (invitations) |
| `API_PORT` / `WEB_PORT` | `3001` / `3000` | apps | Change on port conflicts |
| `LOG_LEVEL` | `debug` | all | `info` in staging/prod; `debug` forbidden in prod |
| `WORKER_MODE` | `0` / `1` | api entrypoint | Selects pg-boss consumer mode |
| `DEV_SEED_ADMIN_EMAIL` / `DEV_SEED_ADMIN_PASSWORD` | dev values | db:seed | Demo admin credentials; variable must be **unset** outside local |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | *(empty)* | observability | No-op export by default (PHASE-002 wiring) |
| `SENTRY_DSN` | *(empty in local)* | error tracking | Staging/prod carry real DSNs ([MONITORING.md](MONITORING.md)) |

**Rule:** no secret is ever committed. If a secret touched the repo: rotate it first, then
purge history per [../security/SECRETS_MANAGEMENT.md](../security/SECRETS_MANAGEMENT.md).

## 6. Common workflows

### 6.1 Author and run one migration

```bash
# Edit the Drizzle schema in the owning module, then draft the SQL:
pnpm --filter api db:generate        # creates apps/api/migrations/NNNN_description.sql
# Hand-edit the file for named constraints, RLS policy, composite tenant FKs,
# partial indexes, triggers (generator does not own these — conventions do).
pnpm --filter api db:migrate         # apply locally
pnpm test:integration                # fresh-apply + regression-apply + RLS checks
```

Never edit an already-applied migration; add a new one instead (forward-only —
[../database/MIGRATION_STRATEGY.md](../database/MIGRATION_STRATEGY.md) §4).

### 6.2 Reset the local database

```bash
docker compose down -v               # stops services AND removes data volumes
docker compose up -d
pnpm --filter api db:migrate && pnpm --filter api db:seed
```

### 6.3 Run a job inline (debugging pg-boss handlers)

```bash
# Terminal 1 — worker consuming queues with verbose logs:
LOG_LEVEL=debug pnpm --filter api dev:worker

# Terminal 2 — enqueue via the jobs API from a one-off script
# (the PHASE-002 test job defines the pattern):
#   import { Jobs } from '...'; await Jobs.publish('reports.render', payload, opts);
pnpm --filter api exec tsx scripts/dev-enqueue.ts   # dev-only helper script
```

Inspect queue state directly:

```bash
docker compose exec postgres psql -U erp_dev -d erp_dev \
  -c "SELECT state, count(*) FROM boss.job GROUP BY state;"
```

### 6.4 Read outbound email (invitations, notifications)

Open **http://localhost:8025** (Mailpit web UI). SMTP target is `localhost:1025`. If mail
is not arriving, check `SMTP_HOST`/`SMTP_PORT` in `.env`.

### 6.5 Inspect object storage (attachments, exports)

Open **http://localhost:9001** and sign in with `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`.
The dev bucket `erp-dev` holds tenant-scoped prefixes (`tenants/<tenant_id>/…`).

### 6.6 psql into the dev database

```bash
docker compose exec postgres psql -U erp_dev -d erp_dev
# Try the isolation behavior yourself (fail-closed):
# SET LOCAL erp.tenant_id IS NOT APPLICABLE — SELECT * FROM audit_events; → 0 rows
```

## 7. Troubleshooting quick hits

| Symptom | Fix |
|---------|-----|
| Port already allocated (`3000/3001/5432/9000`) | Stop the conflicting service or set `WEB_PORT`/`API_PORT`; on Linux check `ss -ltnp` |
| `pnpm install` fails on peer deps | Do not use `--force`; pin via `pnpm.overrides` in the workspace root with a justification comment (tool churn rule, PHASE-001 §7) |
| Node version mismatch errors | `nvm use 22` / `fnm use 22`; check `.nvmrc` |
| Migrations "already applied with different checksum" | You edited an applied migration. Restore it from git and add a **new** migration instead |
| Testcontainers cannot reach Docker | Ensure Docker Desktop is running and the user has socket access; WSL2 users: enable integration for the distro |
| API `/health/ready` fails | Postgres not up yet (`docker compose ps`), or migrations not applied — run `db:migrate` |
| Web renders but API calls fail | `API_PORT` mismatch or CORS; both apps must share the `.env` values |
| Stale schema after switching branches | `docker compose down -v && docker compose up -d` then re-migrate (dev data is disposable) |
| Mailpit empty while app "sent" mail | Wrong `SMTP_HOST`; the API logs the configured host at boot |
| gitleaks flags your branch | You committed a real secret: rotate it **first**, then rewrite history; never just delete the line |

## 8. Docs-first rule for agents (AGENTS.md protocol)

This repository is documentation-driven: the docs under `docs/` are the authoritative
blueprint, and code conforms or the blueprint is amended through change control. The full
protocol is [../../handoff/AGENT_START_HERE.md](../handoff/AGENT_START_HERE.md); the mandatory summary:

1. Start at `docs/handoff/AGENT_START_HERE.md` — the single entry point — and read
   `docs/handoff/IMPLEMENTATION_PROTOCOL.md` before writing code.
2. Read the roadmap/status files, then **only the requested phase document**; never
   implement future phases "while you are there" (scope discipline,
   [../planning/MASTER_ROADMAP.md](../planning/MASTER_ROADMAP.md)).
3. Verify prior phases against actual code/migrations/tests/completion reports — never
   assume completion from the roadmap.
4. Run the full verification gate (`pnpm typecheck && pnpm lint && pnpm test &&
   pnpm test:integration` + phase-specific gates) before reporting.
5. Update every doc your work affects (this file included), append to
   `docs/handoff/CHANGELOG.md`, update `IMPLEMENTATION_STATUS.md` /
   `CURRENT_STATE.md`, and produce a completion report from
   [../implementation/templates/COMPLETION_REPORT_TEMPLATE.md](../implementation/templates/COMPLETION_REPORT_TEMPLATE.md).
6. Hard rules: never fabricate tax rates/legal rules/official API behavior; never bypass
   tenant isolation, the posting engine, or accounting invariants; never report success
   with failed or skipped tests.

CI enforces the docs side: `pnpm docs:validate` (link checker, phase-heading checker,
schema-catalog drift hook) must stay green on every PR
([CI_CD.md](CI_CD.md)).
