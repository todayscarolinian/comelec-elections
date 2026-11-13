// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import type { Db } from '@/server/trpc/init'
import { grantAdmin, listAdmins, revokeAdmin } from '../services/adminPermissions'

const tx = {
  admin: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
}
const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx))
const findMany = vi.fn()
const db = { $transaction: transaction, admin: { findMany } } as unknown as Db

beforeEach(() => {
  vi.clearAllMocks()
  transaction.mockImplementation(async (callback) => callback(tx))
})

describe('grantAdmin', () => {
  beforeEach(() => {
    tx.admin.upsert.mockResolvedValue({ email: 'new@example.com' })
  })

  it('upserts a normalised email without overwriting an existing grant', async () => {
    await grantAdmin(db, { email: '  New@Example.COM ', grantedBy: 'a@example.com' })

    expect(tx.admin.upsert).toHaveBeenCalledWith({
      where: { email: 'new@example.com' },
      update: {},
      create: { email: 'new@example.com', grantedBy: 'a@example.com' },
    })
  })
})

describe('revokeAdmin', () => {
  beforeEach(() => {
    tx.admin.findUnique.mockResolvedValue({ email: 'b@example.com' })
    tx.admin.count.mockResolvedValue(2)
  })

  it('removes the Admin in a Serializable transaction', async () => {
    await revokeAdmin(db, { email: ' B@Example.com ', revokedBy: 'a@example.com' })

    expect(transaction).toHaveBeenCalledTimes(1)
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    })
    expect(tx.admin.delete).toHaveBeenCalledWith({ where: { email: 'b@example.com' } })
  })

  it('rejects revoking the last Admin', async () => {
    tx.admin.count.mockResolvedValue(1)

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'b@example.com' }),
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
    expect(tx.admin.delete).not.toHaveBeenCalled()
  })

  it('rejects revoking someone who is not an Admin', async () => {
    tx.admin.findUnique.mockResolvedValue(null)

    await expect(
      revokeAdmin(db, { email: 'nobody@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(tx.admin.delete).not.toHaveBeenCalled()
  })
})

describe('listAdmins', () => {
  it('lists Admins by email', async () => {
    const rows = [{ email: 'a@example.com', grantedBy: 'seed', grantedAt: new Date() }]
    findMany.mockResolvedValue(rows)

    await expect(listAdmins(db)).resolves.toBe(rows)
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { email: 'asc' },
      select: { email: true, grantedBy: true, grantedAt: true },
    })
  })
})
