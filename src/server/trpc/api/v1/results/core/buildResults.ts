import type { ElectionDef } from '@/election'
import type { ResultsOutput } from '../schema'

export type TallyRow = { questionId: string; candidateId: string | null; votes: number }

type BuildResultsInput = {
  election: ElectionDef
  tally: readonly TallyRow[]
  countedBallots: number
  heldPending: number
  heldRejected: number
  releasedAt: Date | null
}

/** Merges raw counts into config order; Candidates with no votes still appear with 0. */
export function buildResults({
  election,
  tally,
  countedBallots,
  heldPending,
  heldRejected,
  releasedAt,
}: BuildResultsInput): ResultsOutput {
  const votes = new Map<string, number>()
  for (const row of tally) votes.set(`${row.questionId}\u0000${row.candidateId ?? ''}`, row.votes)
  const count = (questionId: string, candidateId: string | null) =>
    votes.get(`${questionId}\u0000${candidateId ?? ''}`) ?? 0

  return {
    releasedAt,
    countedBallots,
    heldPending,
    heldRejected,
    questions: election.questions.map((question) => ({
      id: question.id,
      title: question.title,
      selectionLimit: question.selectionLimit,
      // Every Ballot answers every Question (validateBallot), so all counted Ballots saw it.
      ballotsSeen: countedBallots,
      abstentions: count(question.id, null),
      candidates: question.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        votes: count(question.id, candidate.id),
      })),
    })),
  }
}
