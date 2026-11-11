// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { tx, transaction } = vi.hoisted(() => {
  const tx = {
    admin: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  }
  const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx))
  return { tx, transaction }
})

vi.mock('@/lib/prisma', () => ({
  default: { $transaction: transaction, admin: { findMany: vi.fn() } },
}))

import { grantAdmin, revokeAdmin } from '../services/adminPermissions'

describe('grantAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.admin.upsert.mockResolvedValue({ email: 'new@example.com' })
  })

  it('upserts a normalised email without overwriting an existing grant', async () => {
    await grantAdmin({ email: '  New@Example.COM ', grantedBy: 'a@example.com' })

    expect(tx.admin.upsert).toHaveBeenCalledWith({
      where: { email: 'new@example.com' },
      update: {},
      create: { email: 'new@example.com', grantedBy: 'a@example.com' },
    })
  })

  it('writes GRANT_ADMIN to the audit log in the same transaction', async () => {
    await grantAdmin({ email: 'new@example.com', grantedBy: 'a@example.com' })

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
})

describe('revokeAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.admin.findUnique.mockResolvedValue({ email: 'b@example.com' })
    tx.admin.count.mockResolvedValue(2)
  })

  it('removes the Admin and writes REVOKE_ADMIN in the same Serializable transaction', async () => {
    await revokeAdmin({ email: ' B@Example.com ', revokedBy: 'a@example.com' })

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
      revokeAdmin({ email: 'b@example.com', revokedBy: 'b@example.com' }),
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
    expect(tx.admin.delete).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('rejects revoking someone who is not an Admin', async () => {
    tx.admin.findUnique.mockResolvedValue(null)

    await expect(
      revokeAdmin({ email: 'nobody@example.com', revokedBy: 'a@example.com' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(tx.admin.delete).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
})
