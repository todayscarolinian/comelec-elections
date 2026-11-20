// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setRegistrationStatusService, getRegistrationWindowService } = vi.hoisted(() => ({
  setRegistrationStatusService: vi.fn(),
  getRegistrationWindowService: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('../services/electionState', () => ({
  setElectionStatus: vi.fn(),
  setRegistrationStatus: setRegistrationStatusService,
  getRegistrationWindow: getRegistrationWindowService,
}))

import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { adminRouter } from '../router'

const createCaller = createCallerFactory(adminRouter)

const ADMIN_A = 'a@example.com'
const ADMIN_B = 'b@example.com'

function sessionFor(email: string): Session {
  return { user: { personId: `person-${email}`, email } }
}

function callerFor(email: string | null, admins: Set<string>) {
  const db = {
    person: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        email: 'x',
        name: 'Test',
        createdAt: new Date(),
      })),
    },
    admin: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        admins.has(where.email) ? { email: where.email } : null,
      ),
    },
  } as unknown as Db

  return createCaller(makeCtx({ session: email ? sessionFor(email) : null, db }))
}

describe('registration window procedures', () => {
  beforeEach(() => {
    setRegistrationStatusService.mockReset()
    getRegistrationWindowService.mockReset()
    setRegistrationStatusService.mockImplementation(async (_db: Db, status: string) => ({
      registrationStatus: status,
    }))
    getRegistrationWindowService.mockResolvedValue({
      registrationStatus: 'CLOSED',
      pendingCount: 0,
    })
  })

  describe('permissions', () => {
    it('rejects signed-out callers', async () => {
      const caller = callerFor(null, new Set())

      await expect(caller.setRegistrationStatus({ status: 'OPEN' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
      await expect(caller.getRegistrationWindow()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
      expect(setRegistrationStatusService).not.toHaveBeenCalled()
      expect(getRegistrationWindowService).not.toHaveBeenCalled()
    })

    it('rejects signed-in callers who are not Admins', async () => {
      const caller = callerFor('voter@example.com', new Set([ADMIN_A]))

      await expect(caller.setRegistrationStatus({ status: 'OPEN' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      await expect(caller.getRegistrationWindow()).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(setRegistrationStatusService).not.toHaveBeenCalled()
      expect(getRegistrationWindowService).not.toHaveBeenCalled()
    })

    it('rejects a revoked Admin on their next call', async () => {
      const admins = new Set([ADMIN_A, ADMIN_B])
      const caller = callerFor(ADMIN_B, admins)

      await expect(caller.setRegistrationStatus({ status: 'OPEN' })).resolves.toEqual({
        registrationStatus: 'OPEN',
      })

      admins.delete(ADMIN_B)

      await expect(caller.setRegistrationStatus({ status: 'CLOSED' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      expect(setRegistrationStatusService).toHaveBeenCalledTimes(1)
    })
  })

  describe('setRegistrationStatus', () => {
    it.each(['OPEN', 'CLOSED'] as const)('sets the window to %s', async (status) => {
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(caller.setRegistrationStatus({ status })).resolves.toEqual({
        registrationStatus: status,
      })
      expect(setRegistrationStatusService).toHaveBeenCalledWith(expect.anything(), status)
    })

    it.each(['open', 'PAUSED', ''])('rejects status %j', async (status) => {
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(
        // @ts-expect-error invalid on purpose
        caller.setRegistrationStatus({ status }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expect(setRegistrationStatusService).not.toHaveBeenCalled()
    })
  })

  describe('getRegistrationWindow', () => {
    it('returns the window status and pending count', async () => {
      getRegistrationWindowService.mockResolvedValueOnce({
        registrationStatus: 'OPEN',
        pendingCount: 7,
      })
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(caller.getRegistrationWindow()).resolves.toEqual({
        registrationStatus: 'OPEN',
        pendingCount: 7,
      })
    })
  })
})
