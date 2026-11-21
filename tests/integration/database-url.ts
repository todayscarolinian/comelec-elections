// Only the port is configurable; application and migration URLs are never read.
const port = process.env.COMELEC_TEST_DB_PORT ?? ''
if (!/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535) {
  throw new Error('Set COMELEC_TEST_DB_PORT to the port of a disposable local Postgres instance.')
}
export const testDatabaseUrl = `postgresql://comelec_test:comelec_test@127.0.0.1:${port}/comelec_test`
