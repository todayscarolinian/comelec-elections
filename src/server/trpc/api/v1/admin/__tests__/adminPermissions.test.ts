// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import type { Db } from '@/server/trpc/init'
import {
  AdminNotFoundError,
  AdminRevokeConflictError,
  grantAdmin,
  LastAdminError,
  listAdmins,
  revokeAdmin,
} from '../services/adminPermissions'

const tx = {
  admin: {
    createMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  auditLog: { create: vi.fn() },
}
const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx))
const findMany = vi.fn()
const db = { $transaction: transaction, admin: { findMany } } as unknown as Db

function writeConflict() {
  return Object.assign(new Error('write conflict'), { code: 'P2034' })
}

beforeEach(() => {
  vi.clearAllMocks()
  transaction.mockImplementation(async (callback) => callback(tx))
})

describe('grantAdmin', () => {
  beforeEach(() => {
    tx.admin.createMany.mockResolvedValue({ count: 1 })
  })

  it('creates the Admin with a normalised email, leaving an existing grant untouched', async () => {
    await expect(
      grantAdmin(db, { email: '  New@Example.COM ', grantedBy: 'a@example.com' }),
    ).resolves.toEqual({ email: 'new@example.com', created: true })

    expect(tx.admin.createMany).toHaveBeenCalledWith({
      data: [{ email: 'new@example.com', grantedBy: 'a@example.com' }],
      skipDuplicates: true,
    })
  })

  it('writes GRANT_ADMIN to the audit log in the same transaction', async () => {
    await grantAdmin(db, { email: 'new@example.com', grantedBy: 'a@example.com' })

    expect(transaction).toHaveBeenCalledTimes(1)
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        adminEmail: 'a@example.com',
        action: 'GRANT_ADMIN',
        target: 'new@example.com',
        detail: undefined,
      },
    })
  })

  it('writes no audit row when the person is already an Admin', async () => {
    tx.admin.createMany.mockResolvedValue({ count: 0 })

    await expect(
      grantAdmin(db, { email: 'b@example.com', grantedBy: 'a@example.com' }),
    ).resolves.toEqual({ email: 'b@example.com', created: false })
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
})

describe('revokeAdmin', () => {
  beforeEach(() => {
    tx.admin.findUnique.mockResolvedValue({ email: 'b@example.com' })
    tx.admin.count.mockResolvedValue(2)
  })

  it('removes the Admin and writes REVOKE_ADMIN in the same Serializable transaction', async () => {
    await revokeAdmin(db, { email: ' B@Example.com ', revokedBy: 'a@example.com' })

    expect(transaction).toHaveBeenCalledTimes(1)
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    })
    expect(tx.admin.delete).toHaveBeenCalledWith({ where: { email: 'b@example.com' } })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        adminEmail: 'a@example.com',
        action: 'REVOKE_ADMIN',
        target: 'b@example.com',
        detail: undefined,
      },
    })
  })

  it('rejects revoking the last Admin', async () => {
    tx.admin.count.mockResolvedValue(1)

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'b@example.com' }),
    ).rejects.toBeInstanceOf(LastAdminError)
    expect(tx.admin.delete).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('rejects revoking someone who is not an Admin', async () => {
    tx.admin.findUnique.mockResolvedValue(null)

    await expect(
      revokeAdmin(db, { email: 'nobody@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toBeInstanceOf(AdminNotFoundError)
    expect(tx.admin.delete).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('retries once after a write conflict and re-checks the last-Admin guard', async () => {
    // A concurrent revoke won the race: the retry now sees a single Admin.
    transaction.mockRejectedValueOnce(writeConflict())
    tx.admin.count.mockResolvedValue(1)

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toBeInstanceOf(LastAdminError)
    expect(transaction).toHaveBeenCalledTimes(2)
    expect(tx.admin.delete).not.toHaveBeenCalled()
  })

  it('succeeds when the retry commits', async () => {
    transaction.mockRejectedValueOnce(writeConflict())

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'a@example.com' }),
    ).resolves.toBeUndefined()
    expect(transaction).toHaveBeenCalledTimes(2)
    expect(tx.admin.delete).toHaveBeenCalledTimes(1)
  })

  it('gives up with a conflict error when every attempt hits a write conflict', async () => {
    transaction.mockRejectedValue(writeConflict())

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toBeInstanceOf(AdminRevokeConflictError)
    expect(transaction).toHaveBeenCalledTimes(2)
  })

  it('does not retry other database errors', async () => {
    const failure = new Error('connection lost')
    transaction.mockRejectedValueOnce(failure)

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toBe(failure)
    expect(transaction).toHaveBeenCalledTimes(1)
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
