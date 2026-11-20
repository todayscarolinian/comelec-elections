// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { studentProfileExists, after, runStudentProfileOcr } = vi.hoisted(() => ({
  studentProfileExists: vi.fn(),
  after: vi.fn(),
  runStudentProfileOcr: vi.fn(),
}))

vi.mock('@/server/ocr', () => ({ readStudentProfile: vi.fn() }))
vi.mock('next/server', () => ({ after }))
vi.mock('../core/runStudentProfileOcr', () => ({ runStudentProfileOcr }))
vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('../services/studentProfileStorage', () => ({
  studentProfileExists,
  createSignedStudentProfileUpload: vi.fn(),
}))

import { Prisma } from '@/generated/prisma/client'
import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { registrationRouter } from '../router'

const createCaller = createCallerFactory(registrationRouter)
const personId = 'person-1'
const path = `${personId}/11111111-1111-4111-8111-111111111111`
const session: NonNullable<Session> = { user: { personId, email: 'voter@example.org' } }
const input = { yearLevel: '2' as const, studentProfilePath: path }

type Status = 'OPEN' | 'CLOSED'
type RegStatus = 'PENDING' | 'REJECTED' | 'APPROVED'

function setup({
  currentSession = session as Session,
  window = { registrationStatus: 'OPEN', electionStatus: 'CLOSED' } as {
    registrationStatus: Status
    electionStatus: Status
  } | null,
  existing = null as { status: RegStatus } | null,
} = {}) {
  const tx = {
    $queryRaw: vi.fn(async () => (window ? [window] : [])),
    registration: {
      findUnique: vi.fn(async () => existing),
      create: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: existing?.status === 'APPROVED' ? 0 : 1 })),
    },
  }
  const db = {
    person: {
      findUnique: vi.fn(async () => ({
        id: personId,
        email: 'voter@example.org',
        name: 'Test Voter',
        createdAt: new Date(),
      })),
    },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  }
  return {
    caller: createCaller(makeCtx({ session: currentSession, db: db as unknown as Db })),
    db,
    tx,
  }
}

describe('registration.submit', () => {
  beforeEach(() => {
    studentProfileExists.mockReset()
    studentProfileExists.mockResolvedValue(true)
    after.mockReset()
    runStudentProfileOcr.mockReset()
  })

  it('rejects signed-out callers', async () => {
    const { caller, db } = setup({ currentSession: null })
    await expect(caller.submit(input)).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it('rejects a Year Level outside YEAR_LEVELS', async () => {
    const { caller } = setup()
    // @ts-expect-error invalid on purpose
    await expect(caller.submit({ ...input, yearLevel: '5' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(after).not.toHaveBeenCalled()
  })

  it("rejects another person's path without touching Storage", async () => {
    const { caller } = setup()
    await expect(
      caller.submit({ ...input, studentProfilePath: path.replace('person-1', 'person-2') }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(studentProfileExists).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it('rejects when the object is missing', async () => {
    studentProfileExists.mockResolvedValueOnce(false)
    const { caller, db } = setup()
    await expect(caller.submit(input)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Upload your Student Profile first.',
    })
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it.each([
    ['both closed', { registrationStatus: 'CLOSED', electionStatus: 'CLOSED' } as const],
    ['no ElectionState row', null],
  ])('rejects when %s', async (_, window) => {
    const { caller, tx } = setup({ window })
    await expect(caller.submit(input)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(tx.registration.create).not.toHaveBeenCalled()
    expect(tx.registration.updateMany).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it.each(['PENDING', 'REJECTED'] as const)(
    'rejects resubmission of a %s Registration after Election closure',
    async (status) => {
      const { caller, tx } = setup({
        window: { registrationStatus: 'CLOSED', electionStatus: 'CLOSED' },
        existing: { status },
      })
      await expect(caller.submit(input)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'Registration is closed.',
      })
      expect(tx.registration.updateMany).not.toHaveBeenCalled()
      expect(after).not.toHaveBeenCalled()
    },
  )

  it('allows a late Registration while the Election is open (ADR 0008)', async () => {
    const { caller, tx } = setup({
      window: { registrationStatus: 'CLOSED', electionStatus: 'OPEN' },
    })
    await expect(caller.submit(input)).resolves.toEqual({ status: 'PENDING' })
    expect(tx.registration.create).toHaveBeenCalled()
    expect(after).toHaveBeenCalledTimes(1)
  })

  it('creates a PENDING Registration when none exists', async () => {
    const { caller, tx } = setup()
    await caller.submit(input)
    expect(tx.registration.create).toHaveBeenCalledWith({
      data: {
        personId,
        yearLevel: '2',
        studentProfilePath: path,
        status: 'PENDING',
        submittedAt: expect.any(Date),
        ocrStatus: 'PENDING',
        ocrResult: Prisma.DbNull,
      },
    })
  })

  it.each(['PENDING', 'REJECTED'] as const)(
    'resubmits a %s Registration and clears review fields',
    async (status) => {
      const { caller, tx } = setup({ existing: { status } })
      await caller.submit(input)
      expect(tx.registration.updateMany).toHaveBeenCalledWith({
        where: { personId, status: { in: ['PENDING', 'REJECTED'] } },
        data: expect.objectContaining({
          yearLevel: '2',
          studentProfilePath: path,
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          ocrStatus: 'PENDING',
          ocrResult: Prisma.DbNull,
        }),
      })
    },
  )

  it('rejects an APPROVED Registration', async () => {
    const { caller } = setup({ existing: { status: 'APPROVED' } })
    await expect(caller.submit(input)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Your Registration is already approved',
    })
    expect(after).not.toHaveBeenCalled()
  })

  it('turns a concurrent first submit (P2002) into CONFLICT', async () => {
    const { caller, tx } = setup()
    tx.registration.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    )
    await expect(caller.submit(input)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(after).not.toHaveBeenCalled()
  })

  it('schedules exactly one OCR job on first submit', async () => {
    const { caller } = setup()
    await caller.submit(input)
    expect(after).toHaveBeenCalledTimes(1)
  })

  it.each(['PENDING', 'REJECTED'] as const)(
    'schedules exactly one OCR job when resubmitting a %s Registration',
    async (status) => {
      const { caller } = setup({ existing: { status } })
      await caller.submit(input)
      expect(after).toHaveBeenCalledTimes(1)
    },
  )

  it('runs the job with the Person and submitted values', async () => {
    const { caller, db } = setup()
    await caller.submit(input)

    const job = after.mock.calls[0][0] as () => Promise<void>
    await job()

    expect(runStudentProfileOcr).toHaveBeenCalledWith({
      db,
      personId,
      studentProfilePath: path,
      name: 'Test Voter',
      email: 'voter@example.org',
      yearLevel: '2',
      submittedAt: expect.any(Date),
    })
  })

  it('gives the job the same submittedAt that was stored', async () => {
    const { caller, tx } = setup()
    await caller.submit(input)
    await (after.mock.calls[0][0] as () => Promise<void>)()

    const stored = (
      tx.registration.create.mock.calls[0] as unknown as [{ data: { submittedAt: Date } }]
    )[0].data.submittedAt
    expect(runStudentProfileOcr.mock.calls[0][0].submittedAt).toEqual(stored)
  })

  it('stores the same submittedAt on resubmission', async () => {
    const { caller, tx } = setup({ existing: { status: 'REJECTED' } })
    await caller.submit(input)
    await (after.mock.calls[0][0] as () => Promise<void>)()

    const stored = (
      tx.registration.updateMany.mock.calls[0] as unknown as [{ data: { submittedAt: Date } }]
    )[0].data.submittedAt
    expect(runStudentProfileOcr.mock.calls[0][0].submittedAt).toEqual(stored)
  })
})
