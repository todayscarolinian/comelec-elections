// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import type { Db } from '@/server/trpc/init'
import { getRegistrationWindow, setRegistrationStatus } from '../services/electionState'

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
