// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('@/server/ocr', () => ({ readStudentProfile: vi.fn() }))
vi.mock('../services/studentProfileStorage', () => ({
  createSignedStudentProfileUpload: vi.fn(),
  studentProfileExists: vi.fn(),
}))

import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { registrationRouter } from '../router'

const createCaller = createCallerFactory(registrationRouter)
const session: NonNullable<Session> = {
  user: { personId: 'person-1', email: 'voter@example.org' },
}

function setup({
  currentSession = session as Session,
  registration = { school: null } as { school: string | null } | null,
  resultsReleasedAt = null as Date | null,
} = {}) {
  const tx = {
    electionState: { findUnique: vi.fn(async () => ({ resultsReleasedAt })) },
    registration: {
      // Mirrors the conditional update: only a Registration with no School matches.
      updateMany: vi.fn(async () => ({ count: registration?.school === null ? 1 : 0 })),
      findUnique: vi.fn(async () => (registration ? { id: 'registration-1' } : null)),
    },
    ballot: { updateMany: vi.fn(async () => ({ count: 1 })) },
  }
  const db = {
    person: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        email: 'voter@example.org',
        name: 'Voter',
      })),
    },
    $transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
  } as unknown as Db
  return { caller: createCaller(makeCtx({ session: currentSession, db })), db, tx }
}

describe('registration.setSchool', () => {
  it('records the School only where none is set, then fills a Ballot already cast', async () => {
    const { caller, tx } = setup()

    await expect(caller.setSchool({ school: 'SAS' })).resolves.toEqual({
      school: 'SAS',
    })

    expect(tx.registration.updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { personId: 'person-1', school: null },
      data: { school: 'SAS' },
    })
    expect(tx.ballot.updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { personId: 'person-1', school: null },
      data: { school: 'SAS' },
    })
    expect(tx.ballot.updateMany.mock.invocationCallOrder[0]).toBeGreaterThan(
      tx.registration.updateMany.mock.invocationCallOrder[0],
    )
    expect(tx.registration.findUnique).not.toHaveBeenCalled()
  })

  it('refuses to change a School that is already recorded', async () => {
    const { caller, tx } = setup({ registration: { school: 'SAFAD' } })

    await expect(caller.setSchool({ school: 'SAS' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    expect(tx.ballot.updateMany).not.toHaveBeenCalled()
  })

  it('requires a Registration', async () => {
    const { caller, tx } = setup({ registration: null })

    await expect(caller.setSchool({ school: 'SAFAD' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    expect(tx.ballot.updateMany).not.toHaveBeenCalled()
  })

  it('is closed once Results are released', async () => {
    const { caller, tx } = setup({ resultsReleasedAt: new Date('2026-11-23T09:00:00Z') })

    await expect(caller.setSchool({ school: 'SAFAD' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(tx.registration.updateMany).not.toHaveBeenCalled()
  })

  it.each(['NOT_A_SCHOOL', '', 'school_a'])(
    'rejects %j before touching the database',
    async (school) => {
      const { caller, db } = setup()

      // @ts-expect-error invalid on purpose
      await expect(caller.setSchool({ school })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expect(db.$transaction).not.toHaveBeenCalled()
    },
  )

  it('rejects signed-out callers', async () => {
    const { caller, db } = setup({ currentSession: null })

    await expect(caller.setSchool({ school: 'SAFAD' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
