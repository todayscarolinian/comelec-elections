// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('@/server/trpc/api/v1/registration/services/studentProfileStorage', () => ({
  createSignedStudentProfileView: vi.fn(),
}))

import { Prisma } from '@/generated/prisma/client'
import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { createSignedStudentProfileView } from '@/server/trpc/api/v1/registration/services/studentProfileStorage'
import { adminRouter } from '../router'
import { reviewRegistration } from '../services/registrationReview'

const id = '09a25b2f-c059-45b4-8eb0-36a048d8ad36'
const otherId = 'ba00dbb8-cd5c-4740-b4c4-df34152b6441'
const adminEmail = 'admin@example.org'
const submittedAt = new Date('2026-11-20T06:00:00Z')
const reviewInput = { id, submittedAt }
const session: Session = { user: { personId: 'admin-person', email: adminEmail } }
const validOcr = {
  fields: {
    name: 'Juan de la Cruz',
    studentId: '21012345',
    yearLevel: '2',
    term: '1st Semester 2026',
  },
  matches: { name: true, studentId: true, yearLevel: false, term: true },
}
function row(overrides = {}) {
  return {
    id,
    yearLevel: '3',
    status: 'PENDING',
    submittedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    studentProfilePath: 'student-person/private-profile',
    ocrStatus: 'DONE',
    ocrResult: validOcr,
    person: { name: 'Juan Dela Cruz', email: '21012345@example.org', ballot: null },
    ...overrides,
  }
}
function setup({
  currentSession = session,
  admins = new Set([adminEmail]),
}: { currentSession?: Session; admins?: Set<string> } = {}) {
  const tx = {
    $queryRaw: vi.fn(async (_strings: TemplateStringsArray, ..._values: unknown[]) => [
      {
        id,
        personId: 'student-person',
        status: 'PENDING',
        yearLevel: '3',
        submittedAt: new Date(submittedAt),
      },
    ]),
    registration: { update: vi.fn(async (_args: unknown) => ({ id })) },
    ballot: { updateMany: vi.fn(async () => ({ count: 0 })) },
    auditLog: { create: vi.fn(async (_args: unknown) => ({ id: 'audit-1' })) },
  }
  const db = {
    person: {
      findUnique: vi.fn(async () => ({ id: 'admin-person', name: 'Admin', email: adminEmail })),
    },
    admin: {
      findUnique: vi.fn(async () => (admins.has(adminEmail) ? { email: adminEmail } : null)),
    },
    registration: { findMany: vi.fn(async (_args: unknown) => [row()]) },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  }
  const caller = createCallerFactory(adminRouter)(
    makeCtx({ session: currentSession, db: db as unknown as Db }),
  )
  return { caller, db, tx, admins }
}

beforeEach(() => {
  vi.mocked(createSignedStudentProfileView)
    .mockReset()
    .mockResolvedValue('https://storage.example.org/signed-view')
})

describe('review queue access', () => {
  it.each([
    [null, 'UNAUTHORIZED'],
    [session, 'FORBIDDEN'],
  ] as const)('rejects callers without Admin rights', async (currentSession, code) => {
    const { caller, db } = setup({ currentSession, admins: new Set() })
    await expect(caller.listRegistrations({})).rejects.toMatchObject({ code })
    await expect(caller.approveRegistration(reviewInput)).rejects.toMatchObject({ code })
    await expect(
      caller.rejectRegistration({ ...reviewInput, reason: 'Unreadable' }),
    ).rejects.toMatchObject({
      code,
    })
    expect(db.registration.findMany).not.toHaveBeenCalled()
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(createSignedStudentProfileView).not.toHaveBeenCalled()
  })
  it('rechecks revocation on every query and decision', async () => {
    const { caller, admins } = setup()
    await caller.listRegistrations({})
    admins.clear()
    await expect(caller.listRegistrations({})).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(caller.approveRegistration(reviewInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(
      caller.rejectRegistration({ ...reviewInput, reason: 'Unreadable' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})

describe('admin.listRegistrations', () => {
  it('returns signed profiles and validated OCR without exposing paths or person relations', async () => {
    const { caller } = setup()
    const [registration] = await caller.listRegistrations()
    expect(registration).toMatchObject({
      id,
      name: 'Juan Dela Cruz',
      studentId: '21012345',
      yearLevel: '3',
      studentProfileUrl: 'https://storage.example.org/signed-view',
      ocrStatus: 'DONE',
      ocrResult: validOcr,
    })
    expect(registration).not.toHaveProperty('studentProfilePath')
    expect(registration).not.toHaveProperty('person')
    expect(createSignedStudentProfileView).toHaveBeenCalledWith('student-person/private-profile')
  })
  it('passes optional status and Year Level filters to the database', async () => {
    const { caller, db } = setup()
    await caller.listRegistrations({ status: 'REJECTED', yearLevel: '2' })
    expect(db.registration.findMany.mock.calls[0][0]).toMatchObject({
      where: { status: 'REJECTED', yearLevel: '2' },
      orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
    })
  })
  it('uses ocrView to mark jobs older than ten minutes FAILED', async () => {
    const { caller, db } = setup()
    db.registration.findMany.mockResolvedValueOnce([
      row({
        ocrStatus: 'PENDING',
        submittedAt: new Date(Date.now() - 11 * 60_000),
        ocrResult: null,
      }),
    ])
    expect((await caller.listRegistrations({}))[0]).toMatchObject({
      ocrStatus: 'FAILED',
      ocrResult: null,
    })
  })
  it('keeps fresh OCR PENDING', async () => {
    const { caller, db } = setup()
    db.registration.findMany.mockResolvedValueOnce([row({ ocrStatus: 'PENDING', ocrResult: null })])
    expect((await caller.listRegistrations({}))[0].ocrStatus).toBe('PENDING')
  })
  it.each([
    null,
    { fields: { name: 'invalid' }, matches: {} },
    { ...validOcr, matches: { name: 'yes' } },
  ])('returns null for malformed OCR: %j', async (ocrResult) => {
    const { caller, db } = setup()
    db.registration.findMany.mockResolvedValueOnce([row({ ocrResult })])
    expect((await caller.listRegistrations({}))[0].ocrResult).toBeNull()
  })
  it('preserves fuzzy match flags even when names differ slightly', async () => {
    const { caller } = setup()
    const [registration] = await caller.listRegistrations({})
    expect(registration.ocrResult?.fields.name).not.toBe(registration.name)
    expect(registration.ocrResult?.matches.name).toBe(true)
  })
  it('puts Held Ballots first while keeping order within each group', async () => {
    const { caller, db } = setup()
    db.registration.findMany.mockResolvedValueOnce([
      row(),
      row({
        id: otherId,
        person: { name: 'Held', email: 'held@example.org', ballot: { id: 'ballot' } },
      }),
    ])
    expect((await caller.listRegistrations({})).map((item) => item.id)).toEqual([otherId, id])
  })
  it.each([{}, { status: 'REJECTED' as const }])(
    'keeps rejected Held Ballots in submission order with %j',
    async (filter) => {
      const { caller, db } = setup()
      db.registration.findMany.mockResolvedValueOnce([
        row({ status: 'REJECTED', submittedAt }),
        row({
          id: otherId,
          status: 'REJECTED',
          submittedAt: new Date(submittedAt.getTime() + 1),
          person: { name: 'Held', email: 'held@example.org', ballot: { id: 'ballot' } },
        }),
      ])
      expect(
        (await caller.listRegistrations(filter)).map(({ id, hasHeldBallot }) => ({
          id,
          hasHeldBallot,
        })),
      ).toEqual([
        { id, hasHeldBallot: false },
        { id: otherId, hasHeldBallot: true },
      ])
    },
  )
  it('keeps the queue available when Storage signing fails without leaking errors', async () => {
    const { caller } = setup()
    vi.mocked(createSignedStudentProfileView).mockRejectedValueOnce(
      new Error('private object path'),
    )
    expect((await caller.listRegistrations({}))[0].studentProfileUrl).toBeNull()
  })
  it('sanitizes database errors', async () => {
    const { caller, db } = setup()
    db.registration.findMany.mockRejectedValueOnce(new Error('secret fields'))
    await expect(caller.listRegistrations({})).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to load registrations.',
    })
  })
})

describe('registration decisions', () => {
  it('requires the submission timestamp for both decisions before starting a transaction', async () => {
    const { caller, db } = setup()
    // @ts-expect-error exercises runtime validation of untyped requests
    await expect(caller.approveRegistration({ id })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    const rejection = { id, reason: 'Unreadable' }
    // @ts-expect-error exercises runtime validation of untyped requests
    await expect(caller.rejectRegistration(rejection)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })
  it('does not let an unvalidated service caller bypass the stale-submission check', async () => {
    const { db, tx } = setup()
    const decision = { id, adminEmail, status: 'APPROVED' as const }
    // @ts-expect-error exercises the service's defense against untyped calls
    const result = reviewRegistration(db as unknown as Db, decision)
    await expect(result).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(tx.registration.update).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
  it.each([undefined, '2'] as const)(
    'approves with optional year correction %s and audits atomically',
    async (yearLevel) => {
      const { caller, tx, db } = setup()
      await expect(caller.approveRegistration({ ...reviewInput, yearLevel })).resolves.toEqual({
        ok: true,
      })
      expect(tx.$queryRaw.mock.calls[0][0].join('')).toMatch(/FOR UPDATE/)
      expect(tx.$queryRaw.mock.calls[0][0].join('')).not.toMatch(/ocr/i)
      const expectedYear = yearLevel ?? '3'
      expect(tx.registration.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          status: 'APPROVED',
          yearLevel: expectedYear,
          rejectionReason: null,
          reviewedBy: adminEmail,
          reviewedAt: expect.any(Date),
        },
        select: { id: true },
      })
      expect(tx.ballot.updateMany).toHaveBeenCalledWith({
        where: { personId: 'student-person' },
        data: { yearLevel: expectedYear },
      })
      expect(tx.auditLog.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          adminEmail,
          action: 'APPROVE_REGISTRATION',
          target: id,
          detail: { yearLevel: expectedYear, originalYearLevel: '3' },
        },
      })
      expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
      })
      expect(createSignedStudentProfileView).not.toHaveBeenCalled()
    },
  )
  it('trims and saves the required rejection reason without reading OCR', async () => {
    const { caller, tx } = setup()
    await caller.rejectRegistration({ ...reviewInput, reason: '  Upload current term  ' })
    expect(tx.registration.update.mock.calls[0][0]).toMatchObject({
      data: {
        status: 'REJECTED',
        rejectionReason: 'Upload current term',
        reviewedBy: adminEmail,
        reviewedAt: expect.any(Date),
      },
    })
    expect(tx.ballot.updateMany).not.toHaveBeenCalled()
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1)
    expect(tx.auditLog.create.mock.calls[0][0]).toMatchObject({
      data: {
        action: 'REJECT_REGISTRATION',
        detail: { yearLevel: '3', originalYearLevel: '3', rejectionReason: 'Upload current term' },
      },
    })
  })
  it.each(['', '   ', 'x'.repeat(2001)])('rejects invalid reason', async (reason) => {
    const { caller, db } = setup()
    await expect(caller.rejectRegistration({ ...reviewInput, reason })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })
  it('rejects invalid year and ID', async () => {
    const { caller, db } = setup()
    // @ts-expect-error exercises runtime enum validation
    const invalidYear = caller.approveRegistration({ ...reviewInput, yearLevel: '5' })
    await expect(invalidYear).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    await expect(
      caller.approveRegistration({ ...reviewInput, id: 'invalid' }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })
  it.each(['APPROVED', 'REJECTED'])(
    'blocks changes to %s registrations, including approved voters who cast',
    async (status) => {
      const { caller, tx } = setup()
      tx.$queryRaw.mockResolvedValue([
        { ...reviewInput, personId: 'student-person', status, yearLevel: '3' },
      ])
      await expect(caller.approveRegistration(reviewInput)).rejects.toMatchObject({
        code: 'CONFLICT',
      })
      await expect(
        caller.rejectRegistration({ ...reviewInput, reason: 'Reason' }),
      ).rejects.toMatchObject({
        code: 'CONFLICT',
      })
      expect(tx.registration.update).not.toHaveBeenCalled()
      expect(tx.auditLog.create).not.toHaveBeenCalled()
    },
  )
  it('rejects a decision based on an older document submission', async () => {
    const { caller, tx } = setup()
    const stale = { id, submittedAt: new Date(submittedAt.getTime() - 1) }
    const conflict = {
      code: 'CONFLICT',
      message: 'Registration was resubmitted. Refresh the queue.',
    }
    await expect(caller.approveRegistration(stale)).rejects.toMatchObject(conflict)
    await expect(
      caller.rejectRegistration({ ...stale, reason: 'Unreadable' }),
    ).rejects.toMatchObject(conflict)
    expect(tx.registration.update).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
  it('returns NOT_FOUND for a missing registration', async () => {
    const { caller, tx } = setup()
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(caller.approveRegistration(reviewInput)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
  it('propagates audit failure to roll back the transaction without leaking extracted data', async () => {
    const { caller, tx, db } = setup()
    tx.auditLog.create.mockRejectedValueOnce(new Error('private data'))
    await expect(caller.approveRegistration(reviewInput)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to save the review. Please try again.',
    })
    await expect(db.$transaction.mock.results[0].value).rejects.toThrow('private data')
  })
  it.each([
    [
      'P2034',
      new Prisma.PrismaClientKnownRequestError('private data', {
        code: 'P2034',
        clientVersion: 'test',
      }),
    ],
    ...['40001', '40P01'].flatMap((code) => [
      [
        `P2010/${code}`,
        new Prisma.PrismaClientKnownRequestError('private data', {
          code: 'P2010',
          clientVersion: 'test',
          meta: { code },
        }),
      ],
      [
        `P2010 adapter/${code}`,
        new Prisma.PrismaClientKnownRequestError('private data', {
          code: 'P2010',
          clientVersion: 'test',
          meta: {
            driverAdapterError: new Error('TransactionWriteConflict', {
              cause: { originalCode: code },
            }),
          },
        }),
      ],
      [
        `adapter cause/${code}`,
        new Error('private data', {
          cause: { kind: 'TransactionWriteConflict', originalCode: code },
        }),
      ],
      [`driver/${code}`, Object.assign(new Error('private data'), { code })],
    ]),
  ])('returns a safe conflict for %s', async (_label, error) => {
    const { caller, db } = setup()
    db.$transaction.mockRejectedValueOnce(error)
    await expect(caller.approveRegistration(reviewInput)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Registration changed during review. Refresh and try again.',
      cause: undefined,
    })
  })
  it('sanitizes unrelated raw query errors without treating them as conflicts', async () => {
    const { caller, db } = setup()
    db.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('private data', {
        code: 'P2010',
        clientVersion: 'test',
        meta: {
          driverAdapterError: new Error('private data', { cause: { originalCode: '23505' } }),
        },
      }),
    )
    await expect(caller.approveRegistration(reviewInput)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to save the review. Please try again.',
      cause: undefined,
    })
  })
  it('does not inspect Registration or Election windows to allow reviews after close', async () => {
    const { caller, tx } = setup()
    await caller.approveRegistration(reviewInput)
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    expect(tx.$queryRaw.mock.calls[0][0].join('')).not.toContain('ElectionState')
  })
})
