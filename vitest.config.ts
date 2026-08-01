import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.spec.ts',
      'tests/integration/**/*.spec.ts',
      'tests/end-to-end/**/*.spec.ts',
      'tests/typescript/**/*.spec.ts',
    ],
    testTimeout: 30000,
  },
});
