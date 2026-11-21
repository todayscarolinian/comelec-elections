import type { ResultsOutput } from '@/server/trpc/api/v1/results/schema'

type Question = ResultsOutput['questions'][number]

function selectionDetail(limit: number) {
  return limit === 1 ? 'Choose 1 per ballot' : `Up to ${limit} selections per ballot`
}

function CandidateResult({
  name,
  votes,
  max,
  abstention = false,
}: {
  name: string
  votes: number
  max: number
  abstention?: boolean
}) {
  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className={abstention ? 'text-[#647357]' : ''}>{name}</span>
        <span className="shrink-0 tabular-nums">
          {votes.toLocaleString('en-US')} {abstention ? 'abstentions' : 'votes'}
        </span>
      </div>
      <progress
        className={`result-progress h-1.5 w-full ${abstention ? 'result-progress--abstention' : ''}`}
        aria-label={`${name} ${abstention ? 'abstentions' : 'votes'}`}
        value={votes}
        // An empty tally still renders an empty bar instead of a full one.
        max={Math.max(max, 1)}
      />
    </li>
  )
}

function QuestionResults({ question }: { question: Question }) {
  const headingId = `question-${question.id}`
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-editorial text-2xl leading-tight">
        {question.title}
      </h2>
      <p className="mt-2 mb-4 text-xs text-[#647357]">
        {selectionDetail(question.selectionLimit)} · {question.ballotsSeen.toLocaleString('en-US')}{' '}
        ballots
      </p>
      <ul className="space-y-3">
        {question.candidates.map((candidate) => (
          <CandidateResult
            key={candidate.id}
            name={candidate.name}
            votes={candidate.votes}
            max={question.ballotsSeen}
          />
        ))}
        <CandidateResult
          name="Abstain"
          votes={question.abstentions}
          max={question.ballotsSeen}
          abstention
        />
      </ul>
    </section>
  )
}

/** Per-Question tallies in ballot order. Shared by the public and Admin Results pages. */
export function ResultsTally({ results }: { results: ResultsOutput }) {
  return (
    <div className="grid grid-cols-2 gap-x-12 gap-y-8 max-[42rem]:grid-cols-1">
      {results.questions.map((question) => (
        <QuestionResults key={question.id} question={question} />
      ))}
    </div>
  )
}
