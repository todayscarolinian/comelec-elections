import { ballotInputSchema, type BallotInput } from '@/server/trpc/api/v1/ballot/schema'

/** Validates a complete Ballot without I/O; throws ZodError for invalid input. */
export function validateBallot(input: unknown): BallotInput {
  return ballotInputSchema.parse(input)
}
