import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.spec.ts',
      'tests/integration/**/*.spec.ts',
    ],
    testTimeout: 30000,
  },
});
