import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      include: ['src/utils/**/*.ts', 'src/content/config.ts'],
      exclude: ['src/utils/__tests__/**'],
    },
  },
});
