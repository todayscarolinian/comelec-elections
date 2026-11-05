// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createCallerFactory } from '../init'
import { appRouter } from '../root'

describe('health.ping', () => {
  it('returns ok through createCaller', async () => {
    const caller = createCallerFactory(appRouter)({ headers: new Headers() })
    await expect(caller.health.ping()).resolves.toEqual({ ok: true })
  })
})
