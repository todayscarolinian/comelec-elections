import { z } from 'zod'

export const electionGetOutputSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']),
})
