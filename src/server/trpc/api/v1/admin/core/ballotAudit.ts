import type { ElectionDef } from '@/election'
import type { BALLOT_AUDIT_STATUSES } from '../schema'

export type BallotAuditStatus = (typeof BALLOT_AUDIT_STATUSES)[number]
type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export const registrationStatusFor: Record<BallotAuditStatus, RegistrationStatus> = {
  COUNTED: 'APPROVED',
  HELD_PENDING: 'PENDING',
  HELD_REJECTED: 'REJECTED',
}

export function ballotAuditStatus(status: RegistrationStatus | undefined): BallotAuditStatus {
  if (status === 'APPROVED') return 'COUNTED'
  return status === 'REJECTED' ? 'HELD_REJECTED' : 'HELD_PENDING'
}

export type BallotChoice = {
  questionId: string
  questionTitle: string
  abstained: boolean
  candidates: string[]
}

/** Resolves stored answers to Candidate names, in config order. */
export function ballotChoices(
  election: ElectionDef,
  answers: readonly { questionId: string; candidateId: string | null }[],
): BallotChoice[] {
  return election.questions.map((question) => {
    const picked = new Set(
      answers
        .filter((answer) => answer.questionId === question.id)
        .map((answer) => answer.candidateId),
    )
    return {
      questionId: question.id,
      questionTitle: question.title,
      abstained: picked.has(null),
      candidates: question.candidates
        .filter((candidate) => picked.has(candidate.id))
        .map((candidate) => candidate.name),
    }
  })
}

// Names are user-supplied; prefix values a spreadsheet would evaluate as a formula.
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

export type BallotCsvRow = {
  name: string
  email: string
  yearLevel: string
  castAt: Date
  status: BallotAuditStatus
  choices: BallotChoice[]
}

export function ballotsCsv(election: ElectionDef, rows: readonly BallotCsvRow[]) {
  const header = [
    'Name',
    'Email',
    'Year level',
    'Cast at',
    'Status',
    ...election.questions.map((question) => question.title),
  ]
  const lines = rows.map((row) => [
    row.name,
    row.email,
    row.yearLevel,
    row.castAt.toISOString(),
    row.status,
    ...row.choices.map((choice) => (choice.abstained ? 'Abstain' : choice.candidates.join('; '))),
  ])
  return `${[header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n')}\r\n`
}
