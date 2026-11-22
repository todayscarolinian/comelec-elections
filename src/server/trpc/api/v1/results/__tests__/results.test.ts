// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import type { ElectionDef } from '@/election'
import { createCallerFactory, type Db } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { buildResults } from '../core/buildResults'
import { resultsRouter } from '../router'

const election: ElectionDef = {
  id: 'main',
  title: 'Test',
  questions: [
    {
      id: 'q1',
      title: 'President',
      selectionLimit: 1,
      candidates: [
        { id: 'a', name: 'Ana' },
        { id: 'b', name: 'Ben' },
      ],
    },
  ],
}

describe('buildResults', () => {
  it('keeps config order, includes zero counts and separates abstentions', () => {
    const results = buildResults({
      election,
      tally: [
        { questionId: 'q1', candidateId: 'b', votes: 4 },
        { questionId: 'q1', candidateId: null, votes: 1 },
        { questionId: 'unknown', candidateId: 'z', votes: 9 },
      ],
      countedBallots: 5,
      heldPending: 2,
      heldRejected: 1,
      releasedAt: null,
    })

    expect(results.questions).toEqual([
      {
        id: 'q1',
        title: 'President',
        selectionLimit: 1,
        ballotsSeen: 5,
        abstentions: 1,
        candidates: [
          { id: 'a', name: 'Ana', votes: 0 },
          { id: 'b', name: 'Ben', votes: 4 },
        ],
      },
    ])
    expect(results).toMatchObject({ countedBallots: 5, heldPending: 2, heldRejected: 1 })
  })
})

const ADMIN = 'chair@example.com'
const createCaller = createCallerFactory(resultsRouter)

function setup({ releasedAt = null }: { releasedAt?: Date | null } = {}) {
  const auditCreate = vi.fn().mockResolvedValue({ id: 'audit-1' })
  const groupBy = vi.fn().mockResolvedValue([])
  const ballotCount = vi.fn().mockResolvedValue(0)
  const db = {
    electionState: { findUnique: vi.fn().mockResolvedValue({ resultsReleasedAt: releasedAt }) },
    admin: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        where.email === ADMIN ? { email: ADMIN } : null,
      ),
    },
    ballotAnswer: { groupBy },
    ballot: { count: ballotCount },
    auditLog: { create: auditCreate },
    $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  } as unknown as Db
  const callerFor = (email: string | null) =>
    createCaller(makeCtx({ session: email ? { user: { personId: 'p', email } } : null, db }))
  return { callerFor, auditCreate, groupBy }
}

describe('results.get', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([null, 'voter@example.com', ADMIN])(
    'keeps unreleased Results from the public audience (%s)',
    async (email) => {
      const s = setup()
      await expect(s.callerFor(email).get()).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(s.groupBy).not.toHaveBeenCalled()
      expect(s.auditCreate).not.toHaveBeenCalled()
    },
  )

  it.each([null, 'voter@example.com'])(
    'refuses the admin audience to non-Admins before release (%s)',
    async (email) => {
      const s = setup()
      await expect(s.callerFor(email).get({ audience: 'admin' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      expect(s.groupBy).not.toHaveBeenCalled()
    },
  )

  it('lets an Admin view unreleased Results and audits the view', async () => {
    const s = setup()

    await expect(s.callerFor(ADMIN).get({ audience: 'admin' })).resolves.toMatchObject({
      releasedAt: null,
    })
    expect(s.auditCreate).toHaveBeenCalledExactlyOnceWith({
      data: { adminEmail: ADMIN, action: 'VIEW_RESULTS', target: 'main', detail: undefined },
    })
  })

  it('counts only Ballots from APPROVED Registrations', async () => {
    const s = setup({ releasedAt: new Date('2026-11-24T10:00:00Z') })

    await s.callerFor(null).get()

    expect(s.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ballot: { person: { registration: { is: { status: 'APPROVED' } } } } },
      }),
    )
  })

  it('returns released Results to anyone without auditing', async () => {
    const releasedAt = new Date('2026-11-24T10:00:00Z')
    const s = setup({ releasedAt })

    await expect(s.callerFor(null).get()).resolves.toMatchObject({ releasedAt })
    expect(s.auditCreate).not.toHaveBeenCalled()
  })
})
