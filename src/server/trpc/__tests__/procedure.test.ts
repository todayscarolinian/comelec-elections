// src/server/trpc/__tests__/procedures.test.ts
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))

import {
  adminProcedure,
  createCallerFactory,
  createTRPCRouter,
  protectedProcedure,
  voterProcedure,
  type Db,
} from '@/src/server/trpc/init'
import { makeCtx } from '@/src/server/trpc/helpers'

// Tiny router that exists only to exercise each procedure type.
const testRouter = createTRPCRouter({
  protectedOp: protectedProcedure.query(({ ctx }) => ({ personId: ctx.person.id })),
  voterOp: voterProcedure.query(({ ctx }) => ({ status: ctx.registration.status })),
  adminOp: adminProcedure.query(({ ctx }) => ({ adminEmail: ctx.adminEmail })),
})
const createCaller = createCallerFactory(testRouter)

// Mutable fake database: tests change it between calls to prove nothing is cached.
type FakeState = {
  personExists: boolean
  registrationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  adminEmails: Set<string>
}

function setup(state: Partial<FakeState> = {}) {
  const s: FakeState = {
    personExists: true,
    registrationStatus: null,
    adminEmails: new Set(),
    ...state,
  }
  const db = {
    person: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        s.personExists ? { id: where.id, email: 'jane@example.org', name: 'Jane' } : null,
      ),
    },
    registration: {
      findUnique: vi.fn(async ({ where }: { where: { personId: string } }) =>
        s.registrationStatus
          ? { personId: where.personId, status: s.registrationStatus, yearLevel: '1' }
          : null,
      ),
    },
    admin: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        s.adminEmails.has(where.email) ? { email: where.email } : null,
      ),
    },
  } as unknown as Db

  const session = { user: { personId: 'p1', email: 'Jane@Example.org' } }
  return {
    state: s,
    db,
    signedIn: createCaller(makeCtx({ session, db })),
    signedOut: createCaller(makeCtx({ db })),
  }
}

describe('signed out', () => {
  it.each(['protectedOp', 'voterOp', 'adminOp'] as const)('%s -> UNAUTHORIZED', async (op) => {
    const { signedOut } = setup()
    await expect(signedOut[op]()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('does not touch the database', async () => {
    const { signedOut, db } = setup()
    await signedOut.protectedOp().catch(() => {})
    expect(db.person.findUnique).not.toHaveBeenCalled()
  })
})

describe('session whose Person row is gone', () => {
  it('is treated as signed out', async () => {
    const { signedIn } = setup({ personExists: false })
    await expect(signedIn.protectedOp()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})

describe('Applicant (no Registration, PENDING or REJECTED)', () => {
  it('can use protectedProcedure', async () => {
    const { signedIn } = setup()
    await expect(signedIn.protectedOp()).resolves.toEqual({ personId: 'p1' })
  })

  it.each([null, 'PENDING', 'REJECTED'] as const)(
    'registration=%s -> voterOp FORBIDDEN',
    async (registrationStatus) => {
      const { signedIn } = setup({ registrationStatus })
      await expect(signedIn.voterOp()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    },
  )

  it('adminOp FORBIDDEN', async () => {
    const { signedIn } = setup({ registrationStatus: 'PENDING' })
    await expect(signedIn.adminOp()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

describe('Voter (APPROVED)', () => {
  it('can use voterProcedure and gets registration in ctx', async () => {
    const { signedIn } = setup({ registrationStatus: 'APPROVED' })
    await expect(signedIn.voterOp()).resolves.toEqual({ status: 'APPROVED' })
  })

  it('adminOp FORBIDDEN', async () => {
    const { signedIn } = setup({ registrationStatus: 'APPROVED' })
    await expect(signedIn.adminOp()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

describe('Admin', () => {
  it('can use adminProcedure; the email is normalised before lookup', async () => {
    const { signedIn, db } = setup({ adminEmails: new Set(['jane@example.org']) })
    await expect(signedIn.adminOp()).resolves.toEqual({ adminEmail: 'jane@example.org' })
    expect(db.admin.findUnique).toHaveBeenCalledWith({ where: { email: 'jane@example.org' } })
  })

  it('admin rights do not imply voting: voterOp FORBIDDEN without an approved Registration', async () => {
    const { signedIn } = setup({ adminEmails: new Set(['jane@example.org']) })
    await expect(signedIn.voterOp()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

describe('revoked Admin', () => {
  it('is rejected on the very next call with the same session', async () => {
    const { signedIn, state } = setup({ adminEmails: new Set(['jane@example.org']) })
    await expect(signedIn.adminOp()).resolves.toBeDefined()

    state.adminEmails.delete('jane@example.org') // revoked

    await expect(signedIn.adminOp()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(signedIn.protectedOp()).resolves.toBeDefined() // still signed in
  })
})

describe('status is read from the DB on every call', () => {
  it('Applicant -> approved -> rejected, on one session', async () => {
    const { signedIn, state } = setup({ registrationStatus: 'PENDING' })
    await expect(signedIn.voterOp()).rejects.toMatchObject({ code: 'FORBIDDEN' })

    state.registrationStatus = 'APPROVED'
    await expect(signedIn.voterOp()).resolves.toEqual({ status: 'APPROVED' })

    state.registrationStatus = 'REJECTED'
    await expect(signedIn.voterOp()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
