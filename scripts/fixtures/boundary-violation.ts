// INTENTIONALLY VIOLATES module boundaries — this file MUST fail lint.
// It simulates a web app importing API internals, which DEPENDENCY_RULES.md forbids.
// The CI negative meta-test asserts that `eslint scripts/fixtures/boundary-violation.ts` exits non-zero.
// Do NOT fix this file; do NOT add it to eslint ignores outside the meta-test.
import { HealthController } from '../../apps/api/src/health/health.controller.js';

// Usage to prevent unused-import lint from masking boundary violation
void HealthController;
