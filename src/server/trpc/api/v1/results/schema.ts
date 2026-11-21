import { z } from 'zod'

// `public` never reveals unreleased Results, even to Admins; `admin` does and is audited.
export const getResultsInputSchema = z
  .object({ audience: z.enum(['public', 'admin']).default('public') })
  .default({ audience: 'public' })

export const resultsOutputSchema = z.object({
  releasedAt: z.date().nullable(),
  countedBallots: z.number().int().nonnegative(),
  heldPending: z.number().int().nonnegative(),
  heldRejected: z.number().int().nonnegative(),
  questions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      selectionLimit: z.number().int().positive(),
      ballotsSeen: z.number().int().nonnegative(),
      abstentions: z.number().int().nonnegative(),
      candidates: z.array(
        z.object({ id: z.string(), name: z.string(), votes: z.number().int().nonnegative() }),
      ),
    }),
  ),
})

export type ResultsOutput = z.infer<typeof resultsOutputSchema>
