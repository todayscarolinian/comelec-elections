// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSignedStudentProfileUpload } = vi.hoisted(() => ({
  createSignedStudentProfileUpload: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('@/server/ocr', () => ({ readStudentProfile: vi.fn() }))
vi.mock('../services/studentProfileStorage', () => ({ createSignedStudentProfileUpload }))

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
  electionStatus = 'CLOSED' as 'OPEN' | 'CLOSED',
} = {}) {
  const personFindUnique = vi.fn(async ({ where }: { where: { id: string } }) =>
    personExists
      ? { id: where.id, email: 'voter@example.org', name: 'Test Voter', createdAt: new Date() }
      : null,
  )
  const electionStateFindUnique = vi.fn(async () =>
    registrationStatus ? { registrationStatus, electionStatus } : null,
  )
  const tx = {
    $queryRaw: vi.fn(async () =>
      registrationStatus ? [{ registrationStatus, electionStatus }] : [],
    ),
  }
  const db = {
    person: { findUnique: personFindUnique },
    electionState: { findUnique: electionStateFindUnique },
    $transaction: vi.fn(async (fn: (transaction: typeof tx) => unknown) => fn(tx)),
  } as unknown as Db

  return {
    caller: createCaller(makeCtx({ session: currentSession, db })),
    electionStateFindUnique,
    personFindUnique,
    tx,
  }
}

describe('registration.createStudentProfileUpload', () => {
  beforeEach(() => {
    createSignedStudentProfileUpload.mockReset()
    createSignedStudentProfileUpload.mockResolvedValue({
      path: 'person-1/11111111-1111-4111-8111-111111111111',
      signedUrl: 'https://storage.example.org/signed-upload',
    })
  })

  it('rejects signed-out callers before reading the database', async () => {
    const { caller, personFindUnique } = setup({ currentSession: null })

    await expect(caller.createStudentProfileUpload()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(personFindUnique).not.toHaveBeenCalled()
    expect(createSignedStudentProfileUpload).not.toHaveBeenCalled()
  })

  it('rejects a session whose Person no longer exists', async () => {
    const { caller } = setup({ personExists: false })

    await expect(caller.createStudentProfileUpload()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(createSignedStudentProfileUpload).not.toHaveBeenCalled()
  })

  it.each([null, 'CLOSED'] as const)(
    'rejects when the Registration Period status is %s',
    async (registrationStatus) => {
      const { caller } = setup({ registrationStatus })

      await expect(caller.createStudentProfileUpload()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'The Registration Period is closed.',
      })
      expect(createSignedStudentProfileUpload).not.toHaveBeenCalled()
    },
  )

  it('creates an upload owned by the authenticated Person while Registration is open', async () => {
    const { caller, tx } = setup()

    await expect(caller.createStudentProfileUpload()).resolves.toEqual({
      path: 'person-1/11111111-1111-4111-8111-111111111111',
      signedUrl: 'https://storage.example.org/signed-upload',
    })
    expect(tx.$queryRaw).toHaveBeenCalled()
    expect(createSignedStudentProfileUpload).toHaveBeenCalledWith('person-1')
  })

  it('allows uploads while the Election is open even if the Registration Period is closed', async () => {
    const { caller } = setup({ registrationStatus: 'CLOSED', electionStatus: 'OPEN' })
    await expect(caller.createStudentProfileUpload()).resolves.toMatchObject({
      path: 'person-1/11111111-1111-4111-8111-111111111111',
    })
  })

  it('returns a safe error when Storage cannot create an upload', async () => {
    createSignedStudentProfileUpload.mockRejectedValueOnce(
      new Error('private backend details and credentials'),
    )
    const { caller } = setup()

    await expect(caller.createStudentProfileUpload()).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to prepare the Student Profile upload.',
    })
  })
})
