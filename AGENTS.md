# AGENTS — Repository Instructions for AI Coding Agents

> **Authoritative entry:** [docs/handoff/AGENT_START_HERE.md](docs/handoff/AGENT_START_HERE.md)  
> **Protocol:** [docs/handoff/IMPLEMENTATION_PROTOCOL.md](docs/handoff/IMPLEMENTATION_PROTOCOL.md)  
> **Current state:** [docs/handoff/CURRENT_STATE.md](docs/handoff/CURRENT_STATE.md)  
> **Next action:** [docs/handoff/NEXT_ACTION.md](docs/handoff/NEXT_ACTION.md)

This file is the root pointer required by the project convention. **All implementation rules live in the handoff documents above.** Read them in order before making any change.

## Quick rules

1. Implement **only** the requested phase (scope §2, tasks §5, acceptance §6 in `docs/implementation/phases/PHASE-NNN.md`).
2. Verify prerequisites against actual code + completion reports — never trust the roadmap table alone.
3. Run the full verification gate before reporting: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && python3 scripts/validate-docs.py && bash scripts/check-boundaries.sh`
4. Update [docs/planning/IMPLEMENTATION_STATUS.md](docs/planning/IMPLEMENTATION_STATUS.md), [docs/handoff/CURRENT_STATE.md](docs/handoff/CURRENT_STATE.md), [docs/handoff/NEXT_ACTION.md](docs/handoff/NEXT_ACTION.md), and [docs/handoff/CHANGELOG.md](docs/handoff/CHANGELOG.md) in the same PR.
5. Produce a completion report at `docs/implementation/phases/reports/PHASE-NNN-COMPLETION.md` per [docs/implementation/templates/COMPLETION_REPORT_TEMPLATE.md](docs/implementation/templates/COMPLETION_REPORT_TEMPLATE.md).
6. Never fabricate compliance, bypass tenant isolation, or report success with failing tests.

## Stack (pinned)

Node 22 · pnpm 9.15.9 · Turborepo · NestJS 10 · Next.js 15 · TypeScript 5.6 strict · decimal.js 10 · zod 3 · vitest · eslint (boundaries) · dependency-cruiser · postgres:16 (PHASE-002+) · MinIO · Mailpit

## Dev commands

```bash
pnpm install && cp .env.example .env && docker compose up -d && pnpm dev
pnpm test && pnpm typecheck && pnpm lint && pnpm build
python3 scripts/validate-docs.py && bash scripts/check-boundaries.sh
```
