import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/__tests__/**',
        'src/scratch/**',
        'src/scripts/**',
        'src/index.ts',
        'src/app.ts',
        'src/worker.ts',
        'src/workers/**',
      ],
      thresholds: {
        statements: 0, // subir gradualmente
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
  },
})
