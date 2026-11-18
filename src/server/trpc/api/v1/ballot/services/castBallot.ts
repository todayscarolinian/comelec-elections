import { ZodError } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import { validateBallot } from '@/server/trpc/api/v1/ballot/core/validateBallot'
import type { BallotInput } from '@/server/trpc/api/v1/ballot/schema'
import type { Db } from '@/server/trpc/init'

type CastFailure =
  'ElectionClosed' | 'NotRegistered' | 'RegistrationNotApproved' | 'InvalidBallot' | 'AlreadyVoted'

export class BallotCastError extends Error {
  constructor(readonly reason: CastFailure) {
    super(reason)
  }
}

function isPersonIdTarget(target: unknown) {
  return (
    target === 'Ballot_personId_key' ||
    (Array.isArray(target) && target.length === 1 && target[0] === 'personId')
  )
}

function isPersonIdUniqueViolation(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }
  if (isPersonIdTarget(error.meta?.target)) return true

  // Prisma 7's PostgreSQL adapter preserves the constraint in the driver cause
  // rather than meta.target. Never inspect the error message (it may hold data).
  const adapterError = error.meta?.driverAdapterError
  if (!adapterError || typeof adapterError !== 'object' || !('cause' in adapterError)) return false
  const cause = adapterError.cause
  if (!cause || typeof cause !== 'object' || !('constraint' in cause)) return false
  const constraint = cause.constraint
  if (!constraint || typeof constraint !== 'object') return false
  return (
    ('index' in constraint && constraint.index === 'Ballot_personId_key') ||
    ('fields' in constraint && isPersonIdTarget(constraint.fields))
  )
}

export async function castBallot(db: Db, personId: string, input: unknown): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      const [state] = await tx.$queryRaw<{ electionStatus: 'OPEN' | 'CLOSED' }[]>`
        SELECT "electionStatus"
        FROM "ElectionState"
        WHERE id = 'main'
        FOR SHARE
      `
      if (state?.electionStatus !== 'OPEN') throw new BallotCastError('ElectionClosed')

      const registration = await tx.registration.findUnique({
        where: { personId },
        select: { status: true, yearLevel: true },
      })
      if (!registration) throw new BallotCastError('NotRegistered')
      if (registration.status !== 'APPROVED') throw new BallotCastError('RegistrationNotApproved')

      let validated: BallotInput
      try {
        validated = validateBallot(input)
      } catch (error) {
        if (error instanceof ZodError) throw new BallotCastError('InvalidBallot')
        throw error
      }

      const ballot = await tx.ballot.create({
        data: {
          personId,
          yearLevel: registration.yearLevel,
          disclosureAcceptedAt: new Date(),
        },
        select: { id: true },
      })
      const answers = Object.entries(validated.answers).flatMap(([questionId, answer]) => {
        const candidates = 'abstain' in answer ? [null] : answer.candidateIds
        return candidates.map((candidateId) => ({ ballotId: ballot.id, questionId, candidateId }))
      })
      await tx.ballotAnswer.createMany({ data: answers })
    })
  } catch (error) {
    // The transaction has rolled back before the duplicate-vote error is exposed.
    if (isPersonIdUniqueViolation(error)) throw new BallotCastError('AlreadyVoted')
    throw error
  }
}
