// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import type { Prisma } from '@/generated/prisma/client'
import type { Db } from '@/server/trpc/init'
import { releaseResults } from '../services/electionState'

const adminEmail = 'chair@example.com'

function setup({
  electionStatus = 'CLOSED',
  resultsReleasedAt = null,
  heldPending = 0,
}: {
  electionStatus?: 'OPEN' | 'CLOSED'
  resultsReleasedAt?: Date | null
  heldPending?: number
} = {}) {
  const update = vi.fn(async ({ data }: { data: { resultsReleasedAt: Date } }) => data)
  const auditCreate = vi.fn().mockResolvedValue({ id: 'audit-1' })
  const notificationCreate = vi.fn().mockResolvedValue({ id: 'notification-1' })
  const ballotCount = vi.fn().mockResolvedValue(heldPending)
  const queryRaw = vi.fn().mockResolvedValue([{ electionStatus, resultsReleasedAt }])
  const tx = {
    electionState: { createMany: vi.fn().mockResolvedValue({ count: 0 }), update },
    ballot: { count: ballotCount },
    auditLog: { create: auditCreate },
    notification: { create: notificationCreate },
    $queryRaw: queryRaw,
  }
  const db = {
    $transaction: vi.fn(async (work: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
      work(tx as unknown as Prisma.TransactionClient),
    ),
  } as unknown as Db
  return { db, update, auditCreate, notificationCreate, ballotCount, queryRaw }
}

describe('releaseResults', () => {
  it('sets resultsReleasedAt under the ElectionState lock and audits once', async () => {
    const s = setup()

    const result = await releaseResults(s.db, { adminEmail })

    expect(result.resultsReleasedAt).toBeInstanceOf(Date)
    expect(String(s.queryRaw.mock.calls[0][0].join(''))).toContain('FOR UPDATE')
    expect(s.ballotCount).toHaveBeenCalledWith({
      where: { person: { registration: { is: { status: 'PENDING' } } } },
    })
    expect(s.update).toHaveBeenCalledOnce()
    expect(s.auditCreate).toHaveBeenCalledExactlyOnceWith({
      data: { adminEmail, action: 'RELEASE_RESULTS', target: 'main', detail: undefined },
    })
    expect(s.notificationCreate).toHaveBeenCalledExactlyOnceWith({
      data: { personId: null, type: 'RESULTS_RELEASED', data: undefined },
      select: { id: true },
    })
  })

  it.each([
    ['the Election is still open', { electionStatus: 'OPEN' as const }, 'Close the Election'],
    [
      'Results are already released',
      { resultsReleasedAt: new Date('2026-11-24T10:00:00Z') },
      'already released',
    ],
    ['a Held Ballot is still pending', { heldPending: 2 }, 'Held Ballot'],
  ])('refuses when %s', async (_reason, state, message) => {
    const s = setup(state)

    await expect(releaseResults(s.db, { adminEmail })).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: expect.stringContaining(message),
    })
    expect(s.update).not.toHaveBeenCalled()
    expect(s.auditCreate).not.toHaveBeenCalled()
  })
})
