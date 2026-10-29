// Root ESLint entry point. The shared, source-of-truth config lives in
// packages/config/eslint (per ADR-0002 "shared eslint config" rule).
import { createEslintConfig } from "./packages/config/eslint/index.mjs";

export default createEslintConfig();
