import { baseConfig } from './packages/config/eslint.base.mjs';

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
      'packages/*/dist/**',
      // fixtures deliberately violate boundaries — checked by meta-test, not global lint
      'scripts/fixtures/**',
      'apps/web/src/boundary-fixture/**',
      '.dependency-cruiser.cjs',
      'packages/config/prettier.config.cjs',
      'apps/web/next-env.d.ts',
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
];
