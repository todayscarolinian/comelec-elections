// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSignedStudyLoadUpload } = vi.hoisted(() => ({
  createSignedStudyLoadUpload: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('../services/studyLoadStorage', () => ({ createSignedStudyLoadUpload }))

import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { registrationRouter } from '../router'

const createCaller = createCallerFactory(registrationRouter)
const session: NonNullable<Session> = {
  user: { personId: 'person-1', email: 'voter@example.org' },
}

type RegistrationStatus = 'OPEN' | 'CLOSED' | null

function setup({
  currentSession = session as Session,
  personExists = true,
  registrationStatus = 'OPEN' as RegistrationStatus,
} = {}) {
  const personFindUnique = vi.fn(async ({ where }: { where: { id: string } }) =>
    personExists
      ? { id: where.id, email: 'voter@example.org', name: 'Test Voter', createdAt: new Date() }
      : null,
  )
  const electionStateFindUnique = vi.fn(async () =>
    registrationStatus ? { registrationStatus } : null,
  )
  const db = {
    person: { findUnique: personFindUnique },
    electionState: { findUnique: electionStateFindUnique },
  } as unknown as Db

  return {
    caller: createCaller(makeCtx({ session: currentSession, db })),
    electionStateFindUnique,
    personFindUnique,
  }
}

describe('registration.createStudyLoadUpload', () => {
  beforeEach(() => {
    createSignedStudyLoadUpload.mockReset()
    createSignedStudyLoadUpload.mockResolvedValue({
      path: 'person-1/11111111-1111-4111-8111-111111111111',
      signedUrl: 'https://storage.example.org/signed-upload',
    })
  })

  it('rejects signed-out callers before reading the database', async () => {
    const { caller, personFindUnique } = setup({ currentSession: null })

    await expect(caller.createStudyLoadUpload()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(personFindUnique).not.toHaveBeenCalled()
    expect(createSignedStudyLoadUpload).not.toHaveBeenCalled()
  })

  it('rejects a session whose Person no longer exists', async () => {
    const { caller } = setup({ personExists: false })

    await expect(caller.createStudyLoadUpload()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(createSignedStudyLoadUpload).not.toHaveBeenCalled()
  })

  it.each([null, 'CLOSED'] as const)(
    'rejects when the Registration Period status is %s',
    async (registrationStatus) => {
      const { caller } = setup({ registrationStatus })

      await expect(caller.createStudyLoadUpload()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'The Registration Period is closed.',
      })
      expect(createSignedStudyLoadUpload).not.toHaveBeenCalled()
    },
  )

  it('creates an upload owned by the authenticated Person while Registration is open', async () => {
    const { caller, electionStateFindUnique } = setup()

    await expect(caller.createStudyLoadUpload()).resolves.toEqual({
      path: 'person-1/11111111-1111-4111-8111-111111111111',
      signedUrl: 'https://storage.example.org/signed-upload',
    })
    expect(electionStateFindUnique).toHaveBeenCalledWith({
      where: { id: 'main' },
      select: { registrationStatus: true },
    })
    expect(createSignedStudyLoadUpload).toHaveBeenCalledWith('person-1')
  })

  it('returns a safe error when Storage cannot create an upload', async () => {
    createSignedStudyLoadUpload.mockRejectedValueOnce(
      new Error('private backend details and credentials'),
    )
    const { caller } = setup()

    await expect(caller.createStudyLoadUpload()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to prepare the Study Load upload.',
    })
  })
})
