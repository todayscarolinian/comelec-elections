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
    $queryRaw: vi.fn(async (_strings: TemplateStringsArray, ..._values: unknown[]) =>
      registration ? [registration] : [],
    ),
    registration: { update: vi.fn(async () => ({ id: 'registration-1' })) },
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
  it('records the School once and fills a Ballot already cast', async () => {
    const { caller, tx } = setup()

    await expect(caller.setSchool({ school: 'SCHOOL_B' })).resolves.toEqual({
      school: 'SCHOOL_B',
    })

    const [strings, ...values] = tx.$queryRaw.mock.calls[0] as unknown as [
      TemplateStringsArray,
      ...unknown[],
    ]
    expect(strings.join('?')).toMatch(
      /FROM\s+"Registration"\s+WHERE\s+"personId"\s*=\s*\?\s+FOR UPDATE/i,
    )
    expect(values).toEqual(['person-1'])
    expect(tx.registration.update).toHaveBeenCalledExactlyOnceWith({
      where: { personId: 'person-1' },
      data: { school: 'SCHOOL_B' },
      select: { id: true },
    })
    expect(tx.ballot.updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { personId: 'person-1', school: null },
      data: { school: 'SCHOOL_B' },
    })
  })

  it('refuses to change a School that is already recorded', async () => {
    const { caller, tx } = setup({ registration: { school: 'SCHOOL_A' } })

    await expect(caller.setSchool({ school: 'SCHOOL_B' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    expect(tx.registration.update).not.toHaveBeenCalled()
    expect(tx.ballot.updateMany).not.toHaveBeenCalled()
  })

  it('requires a Registration', async () => {
    const { caller, tx } = setup({ registration: null })

    await expect(caller.setSchool({ school: 'SCHOOL_A' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    expect(tx.registration.update).not.toHaveBeenCalled()
  })

  it('is closed once Results are released', async () => {
    const { caller, tx } = setup({ resultsReleasedAt: new Date('2026-11-23T09:00:00Z') })

    await expect(caller.setSchool({ school: 'SCHOOL_A' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(tx.$queryRaw).not.toHaveBeenCalled()
    expect(tx.registration.update).not.toHaveBeenCalled()
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

    await expect(caller.setSchool({ school: 'SCHOOL_A' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
