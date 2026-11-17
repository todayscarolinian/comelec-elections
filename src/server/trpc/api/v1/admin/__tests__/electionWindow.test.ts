// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TRPCError } from '@trpc/server'

const { setElectionStatusService } = vi.hoisted(() => ({
  setElectionStatusService: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('../services/electionState', () => ({
  setElectionStatus: setElectionStatusService,
  setRegistrationStatus: vi.fn(),
  getRegistrationWindow: vi.fn(),
}))

import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { adminRouter } from '../router'

const createCaller = createCallerFactory(adminRouter)
const ADMIN = 'admin@example.com'

function setup({
  email = ADMIN as string | null,
  admins = new Set([ADMIN]),
  personExists = true,
} = {}) {
  const db = {
    person: {
      findUnique: vi.fn(async () =>
        personExists ? { id: 'person-1', email: ADMIN, name: 'Test', createdAt: new Date() } : null,
      ),
    },
    admin: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        admins.has(where.email) ? { email: where.email } : null,
      ),
    },
  } as unknown as Db
  const session: Session = email ? { user: { personId: 'person-1', email } } : null

  return { caller: createCaller(makeCtx({ session, db })), db, admins }
}

describe('admin.setElectionStatus', () => {
  beforeEach(() => {
    setElectionStatusService.mockReset()
    setElectionStatusService.mockImplementation(async (_db: Db, { status }) => ({
      electionStatus: status,
    }))
  })

  it.each(['OPEN', 'CLOSED'] as const)('allows an Admin to request %s', async (status) => {
    const { caller, db } = setup()

    await expect(caller.setElectionStatus({ status })).resolves.toEqual({ electionStatus: status })
    expect(setElectionStatusService).toHaveBeenCalledExactlyOnceWith(db, {
      status,
      adminEmail: ADMIN,
    })
  })

  it('uses the Admin identity returned by the database guard', async () => {
    const { caller, db } = setup({ email: '  ADMIN@Example.COM ' })

    await caller.setElectionStatus({ status: 'OPEN' })

    expect(db.admin.findUnique).toHaveBeenCalledWith({ where: { email: ADMIN } })
    expect(setElectionStatusService).toHaveBeenCalledWith(db, {
      status: 'OPEN',
      adminEmail: ADMIN,
    })
  })

  it('rejects signed-out callers before querying Admin rights', async () => {
    const { caller, db } = setup({ email: null })

    await expect(caller.setElectionStatus({ status: 'OPEN' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(db.person.findUnique).not.toHaveBeenCalled()
    expect(db.admin.findUnique).not.toHaveBeenCalled()
    expect(setElectionStatusService).not.toHaveBeenCalled()
  })

  it('rejects a session whose Person no longer exists', async () => {
    const { caller, db } = setup({ personExists: false })

    await expect(caller.setElectionStatus({ status: 'CLOSED' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(db.admin.findUnique).not.toHaveBeenCalled()
    expect(setElectionStatusService).not.toHaveBeenCalled()
  })

  it('rejects signed-in non-Admins', async () => {
    const { caller } = setup({ email: 'voter@example.com' })

    await expect(caller.setElectionStatus({ status: 'OPEN' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(setElectionStatusService).not.toHaveBeenCalled()
  })

  it('rejects an Admin immediately on their next call after revocation', async () => {
    const { caller, admins } = setup()
    await caller.setElectionStatus({ status: 'OPEN' })

    admins.delete(ADMIN)

    await expect(caller.setElectionStatus({ status: 'CLOSED' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(setElectionStatusService).toHaveBeenCalledTimes(1)
  })

  it.each([
    undefined,
    {},
    { status: 'open' },
    { status: 'PAUSED' },
    { status: '' },
    { status: null },
    { status: 1 },
  ])('rejects invalid input %j before calling the service', async (input) => {
    const { caller } = setup()

    await expect(
      // @ts-expect-error invalid on purpose
      caller.setElectionStatus(input),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(setElectionStatusService).not.toHaveBeenCalled()
  })

  it('preserves the released-Results precondition error', async () => {
    setElectionStatusService.mockRejectedValueOnce(
      new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Election cannot be reopened after Results are released.',
      }),
    )
    const { caller } = setup()

    await expect(caller.setElectionStatus({ status: 'OPEN' })).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: 'Election cannot be reopened after Results are released.',
    })
  })

  it('fails rather than reporting success when the transaction fails', async () => {
    setElectionStatusService.mockRejectedValueOnce(new Error('Database unavailable'))
    const { caller } = setup()

    await expect(caller.setElectionStatus({ status: 'OPEN' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    })
  })
})
