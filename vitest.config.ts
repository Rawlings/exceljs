import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/config/setup-vitest.js'],
    include: [
      'tests/unit/**/*.spec.js',
      'tests/integration/**/*.spec.js',
      'tests/end-to-end/**/*.spec.js',
      'tests/typescript/**/*.spec.ts',
    ],
    testTimeout: 30000,
  },
});
