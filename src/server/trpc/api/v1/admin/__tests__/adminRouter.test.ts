// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { grantAdminService, revokeAdminService, listAdminsService } = vi.hoisted(() => ({
  grantAdminService: vi.fn(),
  revokeAdminService: vi.fn(),
  listAdminsService: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('../services/adminPermissions', () => ({
  grantAdmin: grantAdminService,
  revokeAdmin: revokeAdminService,
  listAdmins: listAdminsService,
}))

import { TRPCError } from '@trpc/server'
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

describe('admin router', () => {
  beforeEach(() => {
    vi.stubEnv('ALLOWED_HOSTED_DOMAIN', 'example.com')
    grantAdminService.mockReset()
    revokeAdminService.mockReset()
    listAdminsService.mockReset()
    grantAdminService.mockImplementation(async (_db: Db, { email }: { email: string }) => ({
      email,
    }))
    revokeAdminService.mockResolvedValue(undefined)
    listAdminsService.mockResolvedValue([])
  })

  describe('permissions', () => {
    it('rejects signed-out callers on every procedure', async () => {
      const caller = callerFor(null, new Set())

      await expect(caller.grantAdmin({ email: ADMIN_B })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
      await expect(caller.revokeAdmin({ email: ADMIN_B })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
      await expect(caller.listAdmins()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
      expect(grantAdminService).not.toHaveBeenCalled()
      expect(revokeAdminService).not.toHaveBeenCalled()
      expect(listAdminsService).not.toHaveBeenCalled()
    })

    it('rejects signed-in callers who are not Admins on every procedure', async () => {
      const caller = callerFor('voter@example.com', new Set([ADMIN_A]))

      await expect(caller.grantAdmin({ email: ADMIN_B })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      await expect(caller.revokeAdmin({ email: ADMIN_A })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      await expect(caller.listAdmins()).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(grantAdminService).not.toHaveBeenCalled()
      expect(revokeAdminService).not.toHaveBeenCalled()
      expect(listAdminsService).not.toHaveBeenCalled()
    })

    it('rejects a revoked Admin on their next call', async () => {
      const admins = new Set([ADMIN_A, ADMIN_B])
      revokeAdminService.mockImplementation(async (_db: Db, { email }: { email: string }) => {
        admins.delete(email)
      })

      await expect(callerFor(ADMIN_B, admins).listAdmins()).resolves.toEqual([])

      await callerFor(ADMIN_A, admins).revokeAdmin({ email: ADMIN_B })

      await expect(callerFor(ADMIN_B, admins).listAdmins()).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      await expect(callerFor(ADMIN_B, admins).grantAdmin({ email: ADMIN_B })).rejects.toMatchObject(
        {
          code: 'FORBIDDEN',
        },
      )
    })
  })

  describe('grantAdmin', () => {
    it('grants with a normalised email, attributed to the calling Admin', async () => {
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(caller.grantAdmin({ email: '  New.Admin@Example.COM ' })).resolves.toEqual({
        email: 'new.admin@example.com',
      })
      expect(grantAdminService).toHaveBeenCalledWith(expect.anything(), {
        email: 'new.admin@example.com',
        grantedBy: ADMIN_A,
      })
    })

    it.each(['someone@other.org', 'notanemail', '', 'a@example.com.evil.org'])(
      'rejects %j',
      async (email) => {
        const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

        await expect(caller.grantAdmin({ email })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
        expect(grantAdminService).not.toHaveBeenCalled()
      },
    )

    it('rejects everything when ALLOWED_HOSTED_DOMAIN is not set', async () => {
      vi.stubEnv('ALLOWED_HOSTED_DOMAIN', '')
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(caller.grantAdmin({ email: ADMIN_B })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
      expect(grantAdminService).not.toHaveBeenCalled()
    })
  })

  describe('revokeAdmin', () => {
    it('revokes with a normalised email, attributed to the calling Admin', async () => {
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A, ADMIN_B]))

      await expect(caller.revokeAdmin({ email: ' B@Example.com ' })).resolves.toEqual({ ok: true })
      expect(revokeAdminService).toHaveBeenCalledWith(expect.anything(), {
        email: ADMIN_B,
        revokedBy: ADMIN_A,
      })
    })

    it('rejects an email outside the organization domain', async () => {
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(caller.revokeAdmin({ email: 'someone@other.org' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
      expect(revokeAdminService).not.toHaveBeenCalled()
    })

    it.each(['PRECONDITION_FAILED', 'NOT_FOUND', 'CONFLICT'] as const)(
      'surfaces %s from the service',
      async (code) => {
        revokeAdminService.mockRejectedValueOnce(new TRPCError({ code }))
        const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

        await expect(caller.revokeAdmin({ email: ADMIN_A })).rejects.toMatchObject({ code })
      },
    )

    it('leaves unexpected service errors as INTERNAL_SERVER_ERROR', async () => {
      revokeAdminService.mockRejectedValueOnce(new Error('connection lost'))
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(caller.revokeAdmin({ email: ADMIN_A })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
  })

  describe('listAdmins', () => {
    it('returns the Admin list for an Admin', async () => {
      const rows = [{ email: ADMIN_A, grantedBy: 'seed', grantedAt: new Date() }]
      listAdminsService.mockResolvedValueOnce(rows)
      const caller = callerFor(ADMIN_A, new Set([ADMIN_A]))

      await expect(caller.listAdmins()).resolves.toEqual(rows)
    })
  })
})
