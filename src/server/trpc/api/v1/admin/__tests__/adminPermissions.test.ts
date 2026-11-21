// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import type { Db } from '@/server/trpc/init'
import { grantAdmin, listAdmins, revokeAdmin } from '../services/adminPermissions'

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

beforeEach(() => {
  vi.clearAllMocks()
  transaction.mockImplementation(async (callback) => callback(tx))
  tx.auditLog.create.mockResolvedValue({ id: 'audit-1' })
})

describe('grantAdmin', () => {
  beforeEach(() => {
    tx.admin.createMany.mockResolvedValue({ count: 1 })
  })

  it('creates a normalised email without overwriting an existing grant', async () => {
    await expect(
      grantAdmin(db, { email: '  New@Example.COM ', grantedBy: 'a@example.com' }),
    ).resolves.toEqual({ email: 'new@example.com' })

    expect(tx.admin.createMany).toHaveBeenCalledWith({
      data: { email: 'new@example.com', grantedBy: 'a@example.com' },
      skipDuplicates: true,
    })
  })

  it('writes exactly one GRANT_ADMIN audit row after the grant', async () => {
    await grantAdmin(db, { email: 'new@example.com', grantedBy: 'A@Example.com' })

    expect(tx.auditLog.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        adminEmail: 'a@example.com',
        action: 'GRANT_ADMIN',
        target: 'new@example.com',
        detail: undefined,
      },
    })
    expect(tx.auditLog.create.mock.invocationCallOrder[0]).toBeGreaterThan(
      tx.admin.createMany.mock.invocationCallOrder[0],
    )
  })

  it('writes no audit row when the email is already an Admin', async () => {
    tx.admin.createMany.mockResolvedValue({ count: 0 })

    await expect(
      grantAdmin(db, { email: 'b@example.com', grantedBy: 'a@example.com' }),
    ).resolves.toEqual({ email: 'b@example.com' })
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('propagates an audit failure so the grant rolls back', async () => {
    tx.auditLog.create.mockRejectedValueOnce(new Error('audit down'))

    await expect(
      grantAdmin(db, { email: 'new@example.com', grantedBy: 'a@example.com' }),
    ).rejects.toThrow('audit down')
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

  it('writes exactly one REVOKE_ADMIN audit row after the delete', async () => {
    await revokeAdmin(db, { email: 'b@example.com', revokedBy: 'a@example.com' })

    expect(tx.auditLog.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        adminEmail: 'a@example.com',
        action: 'REVOKE_ADMIN',
        target: 'b@example.com',
        detail: undefined,
      },
    })
    expect(tx.auditLog.create.mock.invocationCallOrder[0]).toBeGreaterThan(
      tx.admin.delete.mock.invocationCallOrder[0],
    )
  })

  it('propagates an audit failure so the revoke rolls back', async () => {
    tx.auditLog.create.mockRejectedValueOnce(new Error('audit down'))

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toThrow('audit down')
  })

  it('rejects revoking the last Admin', async () => {
    tx.admin.count.mockResolvedValue(1)

    await expect(
      revokeAdmin(db, { email: 'b@example.com', revokedBy: 'b@example.com' }),
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
    expect(tx.admin.delete).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('rejects revoking someone who is not an Admin', async () => {
    tx.admin.findUnique.mockResolvedValue(null)

    await expect(
      revokeAdmin(db, { email: 'nobody@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(tx.admin.delete).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
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
