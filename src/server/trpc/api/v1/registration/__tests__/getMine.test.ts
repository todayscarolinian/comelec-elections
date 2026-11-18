// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('../services/studentProfileStorage', () => ({
  createSignedStudentProfileUpload: vi.fn(),
  studentProfileExists: vi.fn(),
}))

import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { registrationRouter } from '../router'

const createCaller = createCallerFactory(registrationRouter)
const session: NonNullable<Session> = {
  user: { personId: 'person-1', email: 'applicant@example.org' },
}
type WindowStatus = 'OPEN' | 'CLOSED'
type Registration = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  yearLevel: string
  rejectionReason: string | null
}

function setup({
  currentSession = session as Session,
  personExists = true,
  registration = null as Registration | null,
  window = { registrationStatus: 'OPEN', electionStatus: 'CLOSED' } as {
    registrationStatus: WindowStatus
    electionStatus: WindowStatus
  } | null,
} = {}) {
  const person = {
    id: currentSession?.user.personId ?? 'person-1',
    email: currentSession?.user.email ?? session.user.email,
    name: 'Applicant',
    createdAt: new Date(),
  }
  const db = {
    person: { findUnique: vi.fn(async () => (personExists ? person : null)) },
    registration: {
      findUnique: vi.fn(async ({ where }: { where: { personId: string } }) =>
        where.personId === 'person-1' ? registration : null,
      ),
    },
    electionState: { findUnique: vi.fn(async () => window) },
  }
  return {
    caller: createCaller(makeCtx({ session: currentSession, db: db as unknown as Db })),
    db,
  }
}

describe('registration.getMine', () => {
  it('rejects signed-out callers without reading registrations', async () => {
    const { caller, db } = setup({ currentSession: null })
    await expect(caller.getMine()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(db.registration.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a deleted Person even with a session', async () => {
    const { caller } = setup({ personExists: false })
    await expect(caller.getMine()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('returns no registration for a new Applicant', async () => {
    const { caller } = setup()
    await expect(caller.getMine()).resolves.toEqual({ registration: null, canSubmit: true })
  })

  it.each(['PENDING', 'APPROVED', 'REJECTED'] as const)(
    'returns the caller’s %s status, Year Level and reason only',
    async (status) => {
      const { caller, db } = setup({
        registration: {
          status,
          yearLevel: '3',
          rejectionReason: 'Please include the current term.',
        },
      })
      await expect(caller.getMine()).resolves.toEqual({
        registration: {
          status,
          yearLevel: '3',
          rejectionReason: 'Please include the current term.',
        },
        canSubmit: true,
      })
      expect(db.registration.findUnique).toHaveBeenCalledWith({
        where: { personId: 'person-1' },
        select: { status: true, yearLevel: true, rejectionReason: true },
      })
    },
  )

  it('does not read another Applicant’s registration', async () => {
    const { caller } = setup({
      currentSession: { user: { personId: 'person-2', email: 'other@example.org' } },
      registration: { status: 'APPROVED', yearLevel: '4', rejectionReason: null },
    })
    await expect(caller.getMine()).resolves.toEqual({ registration: null, canSubmit: true })
  })

  it.each([
    ['OPEN', 'CLOSED', true],
    ['CLOSED', 'OPEN', true],
    ['OPEN', 'OPEN', true],
    ['CLOSED', 'CLOSED', false],
  ] as const)(
    'Registration=%s, Election=%s yields canSubmit=%s',
    async (registrationStatus, electionStatus, canSubmit) => {
      const { caller } = setup({ window: { registrationStatus, electionStatus } })
      await expect(caller.getMine()).resolves.toEqual({ registration: null, canSubmit })
    },
  )

  it('fails closed when ElectionState has not been initialized', async () => {
    const { caller } = setup({ window: null })
    await expect(caller.getMine()).resolves.toEqual({ registration: null, canSubmit: false })
  })
})
