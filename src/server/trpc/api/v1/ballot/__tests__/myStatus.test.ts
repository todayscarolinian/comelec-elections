// ballot/__tests__/myStatus.test.ts
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { ballotRouter } from '../router'

const createCaller = createCallerFactory(ballotRouter)
const personId = 'person-1'
const session: NonNullable<Session> = { user: { personId, email: 'voter@example.org' } }

type RegStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

function setup({
  currentSession = session as Session,
  registration = null as RegStatus | null,
  ballot = false,
} = {}) {
  const state = { registration, ballot }
  const db = {
    person: {
      findUnique: vi.fn(async () => ({ id: personId, email: 'voter@example.org', name: 'V' })),
    },
    registration: {
      findUnique: vi.fn(async () => (state.registration ? { status: state.registration } : null)),
    },
    ballot: {
      findUnique: vi.fn(async () => (state.ballot ? { id: 'b1' } : null)),
    },
  }
  return {
    state,
    db,
    caller: createCaller(makeCtx({ session: currentSession, db: db as unknown as Db })),
  }
}

describe('ballot.myStatus', () => {
  it('rejects signed-out callers without querying', async () => {
    const { caller, db } = setup({ currentSession: null })
    await expect(caller.myStatus()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(db.registration.findUnique).not.toHaveBeenCalled()
    expect(db.ballot.findUnique).not.toHaveBeenCalled()
  })

  it('not registered: no Registration, no Ballot', async () => {
    const { caller } = setup()
    await expect(caller.myStatus()).resolves.toEqual({ status: 'not_registered' })
  })

  it.each(['PENDING', 'REJECTED'] as const)(
    'held: %s Registration, no Ballot',
    async (registration) => {
      const { caller } = setup({ registration })
      await expect(caller.myStatus()).resolves.toEqual({ status: 'held' })
    },
  )

  it('can vote: APPROVED Registration, no Ballot', async () => {
    const { caller } = setup({ registration: 'APPROVED' })
    await expect(caller.myStatus()).resolves.toEqual({ status: 'can_vote' })
  })

  it('already voted: a Ballot exists', async () => {
    const { caller } = setup({ registration: 'APPROVED', ballot: true })
    await expect(caller.myStatus()).resolves.toEqual({ status: 'already_voted' })
  })

  it('reads the database on every call', async () => {
    const { caller, state } = setup({ registration: 'PENDING' })
    await expect(caller.myStatus()).resolves.toEqual({ status: 'held' })
    state.registration = 'APPROVED'
    await expect(caller.myStatus()).resolves.toEqual({ status: 'can_vote' })
    state.ballot = true
    await expect(caller.myStatus()).resolves.toEqual({ status: 'already_voted' })
  })

  it('selects only status and id, so no choices are ever loaded', async () => {
    const { caller, db } = setup({ registration: 'APPROVED', ballot: true })
    const result = await caller.myStatus()
    expect(Object.keys(result)).toEqual(['status'])
    expect(db.registration.findUnique).toHaveBeenCalledWith({
      where: { personId },
      select: { status: true },
    })
    expect(db.ballot.findUnique).toHaveBeenCalledWith({
      where: { personId },
      select: { id: true },
    })
  })
})
