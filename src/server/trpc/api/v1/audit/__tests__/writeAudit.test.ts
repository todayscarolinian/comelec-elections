// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { create } = vi.hoisted(() => ({ create: vi.fn() }))

vi.mock('@/lib/prisma', () => ({
  default: { auditLog: { create } },
}))

import { writeAudit } from '../services/writeAudit'

describe('writeAudit', () => {
  beforeEach(() => {
    create.mockReset()
    create.mockResolvedValue({ id: 'audit-1' })
  })

  it('writes a row with the given fields', async () => {
    await writeAudit({
      adminEmail: 'admin@example.com',
      action: 'APPROVE_REGISTRATION',
      target: 'reg-1',
      detail: { yearLevel: 2 },
    })

    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({
      data: {
        adminEmail: 'admin@example.com',
        action: 'APPROVE_REGISTRATION',
        target: 'reg-1',
        detail: { yearLevel: 2 },
      },
    })
  })

  it('trims and lowercases the admin email', async () => {
    await writeAudit({ adminEmail: '  Admin@Example.COM ', action: 'VIEW_BALLOTS' })

    expect(create.mock.calls[0][0].data.adminEmail).toBe('admin@example.com')
  })

  it('allows target and detail to be omitted', async () => {
    await writeAudit({ adminEmail: 'admin@example.com', action: 'RELEASE_RESULTS' })

    const { data } = create.mock.calls[0][0]
    expect(data.target).toBeUndefined()
    expect(data.detail).toBeUndefined()
  })

  it('returns the created row', async () => {
    await expect(
      writeAudit({ adminEmail: 'admin@example.com', action: 'EXPORT_BALLOTS' }),
    ).resolves.toEqual({ id: 'audit-1' })
  })
})
