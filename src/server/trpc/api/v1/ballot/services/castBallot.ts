import { ZodError } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import { validateBallot } from '@/server/trpc/api/v1/ballot/core/validateBallot'
import type { BallotInput } from '@/server/trpc/api/v1/ballot/schema'
import type { Db } from '@/server/trpc/init'

type CastFailure =
  'ElectionClosed' | 'NotRegistered' | 'HeldNotAcknowledged' | 'InvalidBallot' | 'AlreadyVoted'

export class BallotCastError extends Error {
  constructor(readonly reason: CastFailure) {
    super(reason)
  }
}

type RegistrationRow = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  yearLevel: string
  school: string | null
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

export async function castBallot(
  db: Db,
  personId: string,
  input: unknown,
): Promise<{ held: boolean }> {
  try {
    return await db.$transaction(async (tx) => {
      const [state] = await tx.$queryRaw<{ electionStatus: 'OPEN' | 'CLOSED' }[]>`
        SELECT "electionStatus"
        FROM "ElectionState"
        WHERE id = 'main'
        FOR SHARE
      `
      if (state?.electionStatus !== 'OPEN') throw new BallotCastError('ElectionClosed')

      // Lock the Registration row so a concurrent review or resubmission either
      // finishes first (and this cast reads its result) or waits for this cast to
      // commit (and then sees, and updates, the new Ballot).
      const [registration] = await tx.$queryRaw<RegistrationRow[]>`
        SELECT status, "yearLevel", school
        FROM "Registration"
        WHERE "personId" = ${personId}
        FOR SHARE
      `
      if (!registration) throw new BallotCastError('NotRegistered')

      let validated: BallotInput
      try {
        validated = validateBallot(input)
      } catch (error) {
        if (error instanceof ZodError) throw new BallotCastError('InvalidBallot')
        throw error
      }

      const held = registration.status !== 'APPROVED'
      if (held && validated.heldAcknowledged !== true) {
        throw new BallotCastError('HeldNotAcknowledged')
      }

      // Taken from one clock so castAt is never earlier than the acknowledgements.
      const castAt = new Date()
      const ballot = await tx.ballot.create({
        data: {
          personId,
          yearLevel: registration.yearLevel,
          school: registration.school,
          disclosureAcceptedAt: castAt,
          heldAcknowledgedAt: held ? castAt : null,
          castAt,
        },
        select: { id: true },
      })
      const answers = Object.entries(validated.answers).flatMap(([questionId, answer]) => {
        const candidates = 'abstain' in answer ? [null] : answer.candidateIds
        return candidates.map((candidateId) => ({ ballotId: ballot.id, questionId, candidateId }))
      })
      await tx.ballotAnswer.createMany({ data: answers })
      return { held }
    })
  } catch (error) {
    // The transaction has rolled back before the duplicate-vote error is exposed.
    if (isPersonIdUniqueViolation(error)) throw new BallotCastError('AlreadyVoted')
    throw error
  }
}
