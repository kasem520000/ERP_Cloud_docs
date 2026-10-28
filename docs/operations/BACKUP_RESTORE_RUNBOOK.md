# Backup & Restore Runbook — Drill 2026-10-28 staging

> **Restored:** 2026-10-28 03:30 UTC staging from 02:00 UTC pg_basebackup + WAL
> **Duration:** 8m 12s (target <15m) — **PASS**
> **Post-restore checks:** RLS A1–A11 suite green, INV-003 immutability (journal/treasury/inventory) green, audit guard intact, tenant_suspended semantics verified.

Steps: 1) pg_basebackup fetch 2) restore.conf point-in-time 3) start PG16 4) run `migrate.ts --check` 5) run `vitest --grep INV-003` 6) RLS denial 0.

Second engineer cold-run: completed without assist — runbook clear.
