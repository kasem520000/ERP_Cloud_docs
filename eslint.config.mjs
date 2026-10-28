import { baseConfig } from './packages/config/eslint.base.mjs';
import noPhysical from './packages/ui/lint/no-physical-direction.mjs';
import noRawRadix from './packages/ui/lint/no-raw-radix.mjs';
import noRawValues from './packages/ui/lint/no-raw-design-values.mjs';
import importPath from './packages/ui/lint/import-path.mjs';


export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      'pnpm-lock.yaml',
      'apps/web/.next/**',
      'apps/api/dist/**',
      'apps/api/seeds/**',
      'scripts/check-permissions-drift.ts',
      'packages/*/dist/**',
      // fixtures deliberately violate boundaries — checked by meta-test, not global lint
      'scripts/fixtures/**',
      'apps/web/src/boundary-fixture/**',
      '.dependency-cruiser.cjs',
      'packages/config/prettier.config.cjs',
      'apps/web/next-env.d.ts',
      'packages/ui/.storybook/**',
      'packages/ui/storybook-static/**',
    ],
  },
  ...baseConfig,
  {
    // Override for test files that intentionally have unused vars in examples
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    // PHASE-005 design system lint gates (active in CI)
    plugins: {
      erp: { rules: { 'no-physical-direction': noPhysical, 'no-raw-radix': noRawRadix, 'no-raw-design-values': noRawValues, 'import-path': importPath } }
    },
    rules: {
      'erp/no-physical-direction': 'error',
      'erp/no-raw-radix': 'error',
      'erp/no-raw-design-values': 'error',
      'erp/import-path': 'error',
    },
  },
  {
    // Tokens define raw values — exempt from no-raw-design-values
    files: ['packages/ui/src/tokens/**', 'packages/ui/src/**/*.stories.*', 'packages/ui/src/**/*.fixture.*'],
    rules: { 'erp/no-raw-design-values': 'off' },
  },
  {
    // UI generics use RowData extends Record<string,unknown>; allow any/unsafe there and fix projectService for test files with allowDefaultProject
    files: ['packages/ui/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
  {
    files: ['packages/ui/lint/**'],
    rules: { '@typescript-eslint/no-unused-vars': 'off', 'no-empty': 'off', 'erp/no-physical-direction': 'off', 'erp/no-raw-design-values': 'off', 'erp/no-raw-radix': 'off', 'erp/import-path': 'off' },
  },
  {
    // UI tests excluded from tsconfig — disable type-checked
    files: ['packages/ui/src/**/*.test.ts', 'packages/ui/src/**/*.test.tsx'],
    languageOptions: { parserOptions: { projectService: false } },
  },
  {
    // PHASE-006 master-data DB-any relaxation (pool.query returns any)
    files: ['apps/api/src/modules/partners/**', 'apps/api/src/modules/items/**'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-constant-condition': 'off',
      'no-constant-binary-expression': 'off',
    },
  },
];
