import { ELECTION, PARTIES, type ElectionDef } from '@/election'

const election: ElectionDef = ELECTION
const placeholderOfficeTitles: Record<string, string> = {
  'placeholder-question-1': 'President',
  'placeholder-question-2': 'Vice Presidents',
}

// Presentation labels only: persisted Question and Candidate IDs stay unchanged.
export const CANDIDATE_OFFICES = election.questions.map((question) => ({
  ...question,
  title:
    election.title === 'Placeholder Election'
      ? (placeholderOfficeTitles[question.id] ?? question.title)
      : question.title,
}))

export const CANDIDATES = CANDIDATE_OFFICES.flatMap((office) =>
  office.candidates.map((candidate, index) => ({
    ...candidate,
    officeId: office.id,
    officeTitle: office.title,
    number: index + 1,
  })),
)

export type DirectoryCandidate = (typeof CANDIDATES)[number]
export type CandidateFilters = { office: string; party: string; q: string }

export const CANDIDATE_PARTIES = [
  ...PARTIES.filter((party) => CANDIDATES.some((candidate) => candidate.party === party)),
  ...(CANDIDATES.some((candidate) => !candidate.party) ? ['Independent'] : []),
]

export function readCandidateFilters(params: {
  get: (key: string) => string | null
}): CandidateFilters {
  const office = params.get('office') ?? ''
  const party = params.get('party') ?? ''
  return {
    office: CANDIDATE_OFFICES.some((item) => item.id === office) ? office : '',
    party: CANDIDATE_PARTIES.includes(party) ? party : '',
    q: params.get('q') ?? '',
  }
}

export function candidateQueryString(filters: CandidateFilters) {
  const params = new URLSearchParams()
  if (filters.office) params.set('office', filters.office)
  if (filters.party) params.set('party', filters.party)
  if (filters.q) params.set('q', filters.q)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function candidateMatches(candidate: DirectoryCandidate, filters: CandidateFilters) {
  return (
    (!filters.office || candidate.officeId === filters.office) &&
    (!filters.party || (candidate.party ?? 'Independent') === filters.party) &&
    candidate.name.toLocaleLowerCase().includes(filters.q.trim().toLocaleLowerCase())
  )
}

export function candidateHref(id: string) {
  return `/candidates/${encodeURIComponent(id)}`
}
