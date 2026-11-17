import type { z } from 'zod'
import type { myStatusOutputSchema } from '../schema'

export type MyBallotStatus = z.infer<typeof myStatusOutputSchema>['status']

type VoterState = {
  registrationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  hasBallot: boolean
}

export function deriveMyStatus({ registrationStatus, hasBallot }: VoterState): MyBallotStatus {
  if (hasBallot) return registrationStatus === 'APPROVED' ? 'already_voted' : 'held'
  if (registrationStatus === null) return 'not_registered'
  return 'can_vote'
}
