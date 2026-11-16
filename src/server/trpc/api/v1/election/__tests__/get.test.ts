// election/__tests__/get.test.ts
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { createCallerFactory, type Db } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { electionRouter } from '../router'

const createCaller = createCallerFactory(electionRouter)

function setup(row: { electionStatus: 'OPEN' | 'CLOSED' } | null) {
  const db = { electionState: { findUnique: vi.fn(async () => row) } }
  // signed out on purpose: this procedure is public
  return createCaller(makeCtx({ db: db as unknown as Db }))
}

describe('election.get', () => {
  it.each(['OPEN', 'CLOSED'] as const)(
    'returns %s for a signed-out caller',
    async (electionStatus) => {
      await expect(setup({ electionStatus }).get()).resolves.toEqual({ status: electionStatus })
    },
  )

  it('defaults to CLOSED when there is no ElectionState row', async () => {
    await expect(setup(null).get()).resolves.toEqual({ status: 'CLOSED' })
  })
})
