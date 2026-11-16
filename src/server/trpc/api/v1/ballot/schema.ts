import { z } from 'zod'

export const MY_BALLOT_STATUSES = ['not_registered', 'held', 'can_vote', 'already_voted'] as const

export const myStatusOutputSchema = z.object({ status: z.enum(MY_BALLOT_STATUSES) })
