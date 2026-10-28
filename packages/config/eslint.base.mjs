// Shared ESLint flat-config factory for the ERP monorepo.
// Imported by the root eslint.config.mjs; re-exported for package-level extends if needed.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';

export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      boundaries,
      import: importPlugin,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app-api', pattern: 'apps/api/src/**' },
        { type: 'app-web', pattern: 'apps/web/**' },
        { type: 'pkg-contracts', pattern: 'packages/contracts/**' },
        { type: 'pkg-domain-core', pattern: 'packages/domain-core/**' },
        { type: 'pkg-ui', pattern: 'packages/ui/**' },
        { type: 'pkg-config', pattern: 'packages/config/**' },
      ],
    },
    rules: {
      // Strict TS: forbid any in domain code (warn globally, error inside domain-core/contracts)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Boundaries — PHASE-001 baseline; PHASE-002+ tightens per-module rules
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // apps/web may import ui, contracts, domain-core — never api
            { from: 'app-web', allow: ['pkg-ui', 'pkg-contracts', 'pkg-domain-core', 'pkg-config'] },
            // apps/api may import domain-core, contracts, config — never web/ui
            { from: 'app-api', allow: ['pkg-domain-core', 'pkg-contracts', 'pkg-config'] },
            // packages/* may only import domain-core/config/contracts as documented
            { from: 'pkg-contracts', allow: ['pkg-domain-core', 'pkg-config'] },
            { from: 'pkg-domain-core', allow: ['pkg-config'] },
            { from: 'pkg-ui', allow: ['pkg-domain-core', 'pkg-contracts', 'pkg-config'] },
            { from: 'pkg-config', allow: [] },
          ],
        },
      ],
      // Import hygiene
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-duplicates': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="Math"][callee.property.name="round"]',
          message: 'Use Money/Quantity rounding helpers instead of Math.round for financial values (ADR-0009).',
        },
      ],
    },
  },
  {
    // Relax type-checked rules for JS config files and non-src files
    files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.config.ts', '**/test/**/*.ts', '**/*.test.ts', '**/*.spec.ts', 'scripts/**/*'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Test files: allow non-null assertions and console
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
);
