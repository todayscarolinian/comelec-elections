import { Prisma } from '@/generated/prisma/client'
import type { BallotInput } from '@/server/trpc/api/v1/ballot/schema'
import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { appRouter } from '@/server/trpc/root'
import { vi } from 'vitest'

export const personId = 'person-1'
export const now = new Date('2026-11-17T12:00:00.000Z')
export const session: NonNullable<Session> = {
  user: { personId, email: 'voter@example.org' },
}

export function validBallot(): BallotInput {
  return {
    answers: {
      'placeholder-question-1': { abstain: true },
      'placeholder-question-2': {
        candidateIds: ['placeholder-question-2-candidate-d', 'placeholder-question-2-candidate-c'],
      },
    },
    disclosureAccepted: true,
  }
}

export function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('Private database error', {
    code,
    clientVersion: 'test',
    meta,
  })
}

export function setup({
  currentSession = session as Session,
  personExists = true,
  electionStatus = 'OPEN' as 'OPEN' | 'CLOSED' | null,
  registration = { status: 'APPROVED', yearLevel: '2', school: 'SAFAD' } as {
    status: 'APPROVED' | 'PENDING' | 'REJECTED'
    yearLevel: string
    school?: string | null
  } | null,
} = {}) {
  const events: string[] = []
  const tx = {
    $queryRaw: vi.fn(async (strings: TemplateStringsArray, ..._values: unknown[]) => {
      if (strings.join('?').includes('"Registration"')) {
        events.push('registration')
        return registration ? [registration] : []
      }
      events.push('lock')
      return electionStatus ? [{ electionStatus }] : []
    }),
    ballot: {
      create: vi.fn(async (_args: unknown) => {
        events.push('ballot')
        return { id: 'ballot-1' }
      }),
    },
    ballotAnswer: {
      createMany: vi.fn(async (_args: unknown) => {
        events.push('answers')
        return { count: 3 }
      }),
    },
  }
  const db = {
    person: {
      findUnique: vi.fn(async () =>
        personExists
          ? { id: personId, email: 'voter@example.org', name: 'Voter', createdAt: now }
          : null,
      ),
    },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => {
      events.push('begin')
      try {
        const result = await fn(tx)
        events.push('commit')
        return result
      } catch (error) {
        events.push('rollback')
        throw error
      }
    }),
  }
  const ctx = makeCtx({ session: currentSession, db: db as unknown as Db })
  return { caller: createCallerFactory(appRouter)(ctx), ctx, db, tx, events }
}
