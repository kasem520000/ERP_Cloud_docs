import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
    environment: 'node',
    globals: false,
    testTimeout: 10000,
  },
});
