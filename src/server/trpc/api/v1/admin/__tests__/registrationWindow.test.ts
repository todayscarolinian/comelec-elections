// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { Prisma } from '@/generated/prisma/client'
import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { adminRouter } from '../router'

const createCaller = createCallerFactory(adminRouter)
const email = 'admin@example.com'
const session: Session = { user: { personId: 'person-1', email } }
type WindowStatus = 'OPEN' | 'CLOSED'

function setup(currentSession: Session = session, admins = new Set([email])) {
  const state = {
    registrationStatus: 'CLOSED' as WindowStatus,
    electionStatus: 'OPEN' as WindowStatus,
  }
  const tx = {
    electionState: {
      update: vi.fn(async ({ data }: { data: { registrationStatus: WindowStatus } }) => ({
        ...state,
        ...data,
      })),
    },
    auditLog: { create: vi.fn(async () => ({ id: 'audit-1' })) },
  }
  const db = {
    person: { findUnique: vi.fn(async () => ({ id: 'person-1', email })) },
    admin: {
      findUnique: vi.fn(async () => (admins.has(email) ? { email } : null)),
    },
    electionState: {
      findUnique: vi.fn<() => Promise<typeof state | null>>(async () => ({ ...state })),
    },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  }
  const caller = createCaller(makeCtx({ session: currentSession, db: db as unknown as Db }))
  return { caller, db, tx, admins }
}

describe('Admin registration window', () => {
  it.each([
    [null, 'UNAUTHORIZED'],
    [session, 'FORBIDDEN'],
  ] as const)(
    'rejects unauthorized query and mutation callers (%s)',
    async (currentSession, code) => {
      const { caller, db } = setup(currentSession, new Set())
      await expect(caller.getRegistrationStatus()).rejects.toMatchObject({ code })
      await expect(caller.setRegistrationStatus({ status: 'OPEN' })).rejects.toMatchObject({ code })
      expect(db.electionState.findUnique).not.toHaveBeenCalled()
      expect(db.$transaction).not.toHaveBeenCalled()
    },
  )

  it('rechecks Admin rights on the next query and mutation after revocation', async () => {
    const { caller, admins } = setup()
    await expect(caller.getRegistrationStatus()).resolves.toEqual({
      registrationStatus: 'CLOSED',
      electionStatus: 'OPEN',
    })
    admins.delete(email)
    await expect(caller.getRegistrationStatus()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(caller.setRegistrationStatus({ status: 'OPEN' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('reads the persisted window statuses without changing them', async () => {
    const { caller, db } = setup()
    await expect(caller.getRegistrationStatus()).resolves.toEqual({
      registrationStatus: 'CLOSED',
      electionStatus: 'OPEN',
    })
    expect(db.electionState.findUnique).toHaveBeenCalledWith({
      where: { id: 'main' },
      select: { registrationStatus: true, electionStatus: true },
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it.each(['OPEN', 'CLOSED'] as const)(
    'sets explicit status %s and audits within the transaction',
    async (status) => {
      const { caller, db, tx } = setup()
      await expect(caller.setRegistrationStatus({ status })).resolves.toEqual({
        registrationStatus: status,
        electionStatus: 'OPEN',
      })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(tx.electionState.update).toHaveBeenCalledWith({
        where: { id: 'main' },
        data: { registrationStatus: status },
        select: { registrationStatus: true, electionStatus: true },
      })
      expect(tx.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminEmail: email,
          action: 'SET_REGISTRATION_STATUS',
          target: 'main',
          detail: { registrationStatus: status },
        },
      })
    },
  )

  it.each(['open', '', 'APPROVED', null])(
    'rejects invalid status %j before writing',
    async (status) => {
      const { caller, db } = setup()
      // @ts-expect-error invalid input intentionally exercises runtime validation
      await expect(caller.setRegistrationStatus({ status })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    },
  )

  it('fails closed when the seeded state is missing on read', async () => {
    const { caller, db } = setup()
    db.electionState.findUnique.mockResolvedValueOnce(null)
    await expect(caller.getRegistrationStatus()).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
  })

  it('does not create or audit a missing seeded state', async () => {
    const { caller, tx } = setup()
    tx.electionState.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Missing row', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    )
    await expect(caller.setRegistrationStatus({ status: 'OPEN' })).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('propagates audit failure out of the transaction so Prisma rolls back the update', async () => {
    const { caller, db, tx } = setup()
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit unavailable'))
    await expect(caller.setRegistrationStatus({ status: 'OPEN' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    })
    await expect(db.$transaction.mock.results[0].value).rejects.toThrow('Audit unavailable')
  })
})
