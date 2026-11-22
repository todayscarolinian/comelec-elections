import { defineConfig } from 'prisma/config'
import { testDatabaseUrl } from './tests/integration/database-url'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: testDatabaseUrl },
})
