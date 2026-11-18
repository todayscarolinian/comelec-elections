// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import type { Db } from '@/server/trpc/init'
import type { Prisma } from '@/generated/prisma/client'
import {
  getRegistrationWindow,
  setElectionStatus,
  setRegistrationStatus,
} from '../services/electionState'

const upsert = vi.fn()
const findUnique = vi.fn()
const count = vi.fn()
const transaction = vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries))
const db = {
  $transaction: transaction,
  electionState: { upsert, findUnique },
  registration: { count },
} as unknown as Db

beforeEach(() => {
  vi.clearAllMocks()
})

describe('setRegistrationStatus', () => {
  it.each(['OPEN', 'CLOSED'] as const)('upserts the main row with %s', async (status) => {
    upsert.mockResolvedValue({ registrationStatus: status })

    await expect(setRegistrationStatus(db, status)).resolves.toEqual({
      registrationStatus: status,
    })
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 'main' },
      update: { registrationStatus: status },
      create: { id: 'main', registrationStatus: status },
      select: { registrationStatus: true },
    })
  })
})

describe('getRegistrationWindow', () => {
  it('returns the status and counts only PENDING Registrations', async () => {
    findUnique.mockResolvedValue({ registrationStatus: 'OPEN' })
    count.mockResolvedValue(3)

    await expect(getRegistrationWindow(db)).resolves.toEqual({
      registrationStatus: 'OPEN',
      pendingCount: 3,
    })
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'main' },
      select: { registrationStatus: true },
    })
    expect(count).toHaveBeenCalledWith({ where: { status: 'PENDING' } })
    expect(transaction).toHaveBeenCalledTimes(1)
  })

  it('treats a missing ElectionState row as CLOSED', async () => {
    findUnique.mockResolvedValue(null)
    count.mockResolvedValue(0)

    await expect(getRegistrationWindow(db)).resolves.toEqual({
      registrationStatus: 'CLOSED',
      pendingCount: 0,
    })
  })
})

describe('setElectionStatus', () => {
  const adminEmail = 'admin@example.com'
  type Status = 'OPEN' | 'CLOSED'
  type State = {
    electionStatus: Status
    registrationStatus: Status
    resultsReleasedAt: Date | null
  }

  function setup(
    initial: State | null = {
      electionStatus: 'CLOSED',
      registrationStatus: 'CLOSED',
      resultsReleasedAt: null,
    },
  ) {
    let state = initial ? { ...initial } : null
    const createMany = vi.fn(async () => {
      if (state) return { count: 0 }
      state = { electionStatus: 'CLOSED', registrationStatus: 'CLOSED', resultsReleasedAt: null }
      return { count: 1 }
    })
    const queryRaw = vi.fn(async () => (state ? [{ ...state }] : []))
    const update = vi.fn(async ({ data }: { data: { electionStatus: Status } }) => {
      state = { ...state!, electionStatus: data.electionStatus }
      return { electionStatus: data.electionStatus }
    })
    const auditCreate = vi.fn().mockResolvedValue({ id: 'audit-1' })
    const ballotAccess = vi.fn(() => {
      throw new Error('Election toggle must not access Ballots')
    })
    const tx = {
      electionState: { createMany, update },
      $queryRaw: queryRaw,
      auditLog: { create: auditCreate },
      get ballot() {
        return ballotAccess()
      },
      get ballotAnswer() {
        return ballotAccess()
      },
    }
    const transaction = vi.fn(async (work: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
      work(tx as unknown as Prisma.TransactionClient),
    )
    // Only the transaction client has write methods; accidental global writes fail the test.
    const db = { $transaction: transaction } as unknown as Db

    return {
      db,
      createMany,
      queryRaw,
      update,
      auditCreate,
      transaction,
      ballotAccess,
      state: () => state,
    }
  }

  it.each([
    ['CLOSED', 'OPEN'],
    ['OPEN', 'CLOSED'],
  ] as const)('changes %s to %s and audits it in the same transaction', async (from, status) => {
    const s = setup({ electionStatus: from, registrationStatus: 'OPEN', resultsReleasedAt: null })

    await expect(setElectionStatus(s.db, { status, adminEmail })).resolves.toEqual({
      electionStatus: status,
    })

    expect(s.transaction).toHaveBeenCalledTimes(1)
    expect(s.createMany).toHaveBeenCalledExactlyOnceWith({
      data: { id: 'main' },
      skipDuplicates: true,
    })
    const [sql] = s.queryRaw.mock.calls[0] as unknown as [TemplateStringsArray]
    expect(sql.join('')).toContain('SELECT "electionStatus", "resultsReleasedAt"')
    expect(sql.join('')).toContain("WHERE id = 'main'")
    expect(sql.join('')).toContain('FOR UPDATE')
    expect(s.queryRaw.mock.invocationCallOrder[0]).toBeGreaterThan(
      s.createMany.mock.invocationCallOrder[0],
    )
    expect(s.update.mock.invocationCallOrder[0]).toBeGreaterThan(
      s.queryRaw.mock.invocationCallOrder[0],
    )
    expect(s.update).toHaveBeenCalledExactlyOnceWith({
      where: { id: 'main' },
      data: { electionStatus: status },
      select: { electionStatus: true },
    })
    expect(s.auditCreate).toHaveBeenCalledExactlyOnceWith({
      data: {
        adminEmail,
        action: 'SET_ELECTION_STATUS',
        target: 'main',
        detail: { previousStatus: from, status },
      },
    })
    expect(s.auditCreate.mock.invocationCallOrder[0]).toBeGreaterThan(
      s.update.mock.invocationCallOrder[0],
    )
    expect(s.state()).toEqual({
      electionStatus: status,
      registrationStatus: 'OPEN',
      resultsReleasedAt: null,
    })
    expect(s.ballotAccess).not.toHaveBeenCalled()
  })

  it('allows close then reopen without accessing existing Ballots', async () => {
    const s = setup({
      electionStatus: 'OPEN',
      registrationStatus: 'CLOSED',
      resultsReleasedAt: null,
    })

    await setElectionStatus(s.db, { status: 'CLOSED', adminEmail })
    await expect(setElectionStatus(s.db, { status: 'OPEN', adminEmail })).resolves.toEqual({
      electionStatus: 'OPEN',
    })

    expect(s.ballotAccess).not.toHaveBeenCalled()
    expect(s.auditCreate).toHaveBeenCalledTimes(2)
    expect(s.auditCreate.mock.calls.map(([args]) => args.data.detail)).toEqual([
      { previousStatus: 'OPEN', status: 'CLOSED' },
      { previousStatus: 'CLOSED', status: 'OPEN' },
    ])
  })

  it.each(['OPEN', 'CLOSED'] as const)(
    'treats %s to itself as a no-op without update or audit',
    async (status) => {
      const s = setup({
        electionStatus: status,
        registrationStatus: 'OPEN',
        resultsReleasedAt: null,
      })

      await expect(setElectionStatus(s.db, { status, adminEmail })).resolves.toEqual({
        electionStatus: status,
      })

      expect(s.queryRaw).toHaveBeenCalledTimes(1)
      expect(s.update).not.toHaveBeenCalled()
      expect(s.auditCreate).not.toHaveBeenCalled()
    },
  )

  it.each(['OPEN', 'CLOSED'] as const)(
    'rejects OPEN after release even if the stored status is %s',
    async (current) => {
      const releasedAt = new Date('2026-11-20T10:00:00Z')
      const s = setup({
        electionStatus: current,
        registrationStatus: 'CLOSED',
        resultsReleasedAt: releasedAt,
      })

      await expect(setElectionStatus(s.db, { status: 'OPEN', adminEmail })).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: 'Election cannot be reopened after Results are released.',
      })

      expect(s.update).not.toHaveBeenCalled()
      expect(s.auditCreate).not.toHaveBeenCalled()
      expect(s.state()?.resultsReleasedAt).toEqual(releasedAt)
    },
  )

  it('can close an inconsistent released-but-open Election without clearing the release timestamp', async () => {
    const releasedAt = new Date('2026-11-20T10:00:00Z')
    const s = setup({
      electionStatus: 'OPEN',
      registrationStatus: 'CLOSED',
      resultsReleasedAt: releasedAt,
    })

    await expect(setElectionStatus(s.db, { status: 'CLOSED', adminEmail })).resolves.toEqual({
      electionStatus: 'CLOSED',
    })

    expect(s.state()?.resultsReleasedAt).toEqual(releasedAt)
    expect(s.auditCreate).toHaveBeenCalledTimes(1)
  })

  it('treats CLOSED after release as a no-op', async () => {
    const s = setup({
      electionStatus: 'CLOSED',
      registrationStatus: 'CLOSED',
      resultsReleasedAt: new Date(),
    })

    await expect(setElectionStatus(s.db, { status: 'CLOSED', adminEmail })).resolves.toEqual({
      electionStatus: 'CLOSED',
    })
    expect(s.update).not.toHaveBeenCalled()
    expect(s.auditCreate).not.toHaveBeenCalled()
  })

  it('creates a missing singleton as CLOSED before opening and auditing it', async () => {
    const s = setup(null)

    await expect(setElectionStatus(s.db, { status: 'OPEN', adminEmail })).resolves.toEqual({
      electionStatus: 'OPEN',
    })
    expect(s.state()?.registrationStatus).toBe('CLOSED')
    expect(s.auditCreate.mock.calls[0][0].data.detail).toEqual({
      previousStatus: 'CLOSED',
      status: 'OPEN',
    })
  })

  it('initializes a missing singleton as CLOSED without auditing a transition', async () => {
    const s = setup(null)

    await expect(setElectionStatus(s.db, { status: 'CLOSED', adminEmail })).resolves.toEqual({
      electionStatus: 'CLOSED',
    })
    expect(s.state()?.electionStatus).toBe('CLOSED')
    expect(s.update).not.toHaveBeenCalled()
    expect(s.auditCreate).not.toHaveBeenCalled()
  })

  it('propagates an audit failure out of the transaction callback so Prisma rolls back', async () => {
    const s = setup()
    const failure = new Error('Audit write failed')
    s.auditCreate.mockRejectedValueOnce(failure)

    await expect(setElectionStatus(s.db, { status: 'OPEN', adminEmail })).rejects.toBe(failure)
    expect(s.transaction).toHaveBeenCalledTimes(1)
    expect(s.update).toHaveBeenCalledTimes(1)
    expect(s.auditCreate).toHaveBeenCalledTimes(1)
    // The mock checks propagation; actual database rollback requires a Postgres integration test.
  })

  it('does not write an audit row when the status update fails', async () => {
    const s = setup()
    const failure = new Error('Status update failed')
    s.update.mockRejectedValueOnce(failure)

    await expect(setElectionStatus(s.db, { status: 'OPEN', adminEmail })).rejects.toBe(failure)
    expect(s.auditCreate).not.toHaveBeenCalled()
  })

  it('fails closed if the singleton unexpectedly cannot be locked', async () => {
    const s = setup()
    s.queryRaw.mockResolvedValueOnce([])

    await expect(setElectionStatus(s.db, { status: 'OPEN', adminEmail })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to load the Election state.',
    })
    expect(s.update).not.toHaveBeenCalled()
    expect(s.auditCreate).not.toHaveBeenCalled()
  })
})
