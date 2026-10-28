// INTENTIONALLY VIOLATES module boundaries — this file MUST fail lint.
// It simulates a web app importing API internals, which DEPENDENCY_RULES.md forbids.
// The CI negative meta-test asserts that `eslint apps/web/src/boundary-fixture/violation.ts --no-ignore` exits non-zero.
// Do NOT fix this file; do NOT add it to eslint ignores outside the meta-test.
import { HealthController } from '../../../api/src/health/health.controller.js';
void HealthController;
