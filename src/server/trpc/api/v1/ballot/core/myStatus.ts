import type { z } from 'zod'
import type { myStatusOutputSchema } from '../schema'

export type MyBallotStatus = z.infer<typeof myStatusOutputSchema>['status']

type VoterState = {
  registrationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  hasBallot: boolean
}

/**
 * ADR 0008: anyone with a Registration may vote while the Election is open; a Ballot
 * from a not-yet-approved Registration is held. Whether the Election is open is
 * election.get's job, so the UI combines the two.
 */
export function deriveMyStatus({ registrationStatus, hasBallot }: VoterState): MyBallotStatus {
  if (hasBallot) return 'already_voted'
  if (registrationStatus === null) return 'not_registered'
  if (registrationStatus === 'APPROVED') return 'can_vote'
  return 'held'
}
