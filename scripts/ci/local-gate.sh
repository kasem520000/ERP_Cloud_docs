#!/usr/bin/env bash
# Local CI-equivalent gate (mirrors .github/workflows/ci.yml + ci-db.yml jobs;
# gitleaks runs in CI only — a local binary dependency is not imposed).
set -euo pipefail
cd "$(dirname "$0")/../.."

run() {
  printf '\n=== %s ===\n' "$1"
  shift
  "$@"
}

run "typecheck" pnpm typecheck
run "lint (incl. module boundaries)" pnpm lint
run "lint:depcruise (dependency graph rules)" pnpm lint:depcruise
run "permissions docs-drift (seed ↔ AUTHORIZATION_MATRIX)" pnpm check:permissions-drift
run "unit + property tests" pnpm test
run "db suite (embedded PostgreSQL 16: RLS attacks, identity flows, jobs, files, readiness)" pnpm test:db
run "build" pnpm build
run "docs validation (29 checks)" pnpm docs:validate
run "negative boundary meta-test" pnpm boundary:negative-test

printf '\n=== ALL LOCAL GATES GREEN ===\n'
