// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createCallerFactory } from '../init'
import { appRouter } from '../root'
import { makeCtx } from '@/src/server/trpc/helpers'

describe('health.ping', () => {
  it('returns ok through createCaller', async () => {
    const caller = createCallerFactory(appRouter)(makeCtx())
    await expect(caller.health.ping()).resolves.toEqual({ ok: true })
  })
})
