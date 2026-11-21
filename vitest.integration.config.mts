import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.integration.ts'],
    // Fixtures share a database and truncate it between tests.
    fileParallelism: false,
  },
})
