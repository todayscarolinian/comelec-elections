import { z } from 'zod'
import { ELECTION, type QuestionDef } from '@/election'

function createAnswerSchema(question: QuestionDef) {
  const candidateIds = new Set(question.candidates.map(({ id }) => id))

  return z.union([
    z.strictObject({ abstain: z.literal(true) }),
    z.strictObject({
      candidateIds: z
        .array(
          z.string().refine((id) => candidateIds.has(id), {
            message: 'Candidate must belong to this Question',
          }),
        )
        .min(1)
        .max(question.selectionLimit)
        .refine((ids) => new Set(ids).size === ids.length, {
          message: 'Candidate IDs must not repeat',
        }),
    }),
  ])
}

type QuestionId = (typeof ELECTION.questions)[number]['id']

// Every configured Question contributes one required field. Object.fromEntries
// widens keys to string, so retain the config's literal IDs for inferred inputs.
const answerShape = Object.fromEntries(
  ELECTION.questions.map((question) => [question.id, createAnswerSchema(question)]),
) as Record<QuestionId, ReturnType<typeof createAnswerSchema>>

export const ballotInputSchema = z.strictObject({
  answers: z.strictObject(answerShape),
  disclosureAccepted: z.literal(true),
})

export type BallotInput = z.infer<typeof ballotInputSchema>
