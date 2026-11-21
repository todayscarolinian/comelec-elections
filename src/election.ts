export const PARTIES = ['STAND', 'TINGOG!', 'SPP'] as const

export type PartyId = (typeof PARTIES)[number]

export type CandidateDef = {
  readonly id: string // stable, never changes once the Election has opened
  readonly profileId?: string // public candidate profile ID when it differs from the ballot ID
  readonly name: string
  readonly party?: PartyId // Omitted means that the Candidate is Independent
  readonly photo: string // path under /public/candidates
  readonly bio: string
}

export type QuestionDef = {
  readonly id: string // stable, never changes once the Election has opened
  readonly title: string
  readonly selectionLimit: number // 1 = single choice
  readonly candidates: CandidateDef[] // display order = array order
}

export type ElectionDef = {
  readonly id: string
  readonly title: string
  readonly questions: readonly QuestionDef[]
}

// These IDs become persisted Ballot references once the Election opens.
// Question and Candidate ids must never be renamed or removed after that point.
export const ELECTION = {
  id: 'main',
  title: 'Placeholder Election',
  questions: [
    {
      id: 'placeholder-question-1',
      title: 'Placeholder Question 1',
      selectionLimit: 1,
      candidates: [
        {
          id: 'placeholder-question-1-candidate-a',
          name: 'Candidate A',
          party: 'STAND',
          photo: '/candidates/placeholder-candidate-a.svg',
          bio: 'Placeholder biography for Candidate A.',
        },
        {
          id: 'placeholder-question-1-candidate-b',
          name: 'Candidate B',
          party: 'TINGOG!',
          photo: '/candidates/placeholder-candidate-b.svg',
          bio: 'Placeholder biography for Candidate B.',
        },
      ],
    },
    {
      id: 'placeholder-question-2',
      title: 'Placeholder Question 2',
      selectionLimit: 2,
      candidates: [
        {
          id: 'placeholder-question-2-candidate-c',
          name: 'Candidate C',
          party: 'SPP',
          photo: '/candidates/placeholder-candidate-c.svg',
          bio: 'Placeholder biography for Candidate C.',
        },
        {
          id: 'placeholder-question-2-candidate-d',
          name: 'Candidate D',
          photo: '/candidates/placeholder-candidate-d.svg',
          bio: 'Placeholder biography for Candidate D.',
        },
      ],
    },
  ],
} as const satisfies ElectionDef

// Term printed on the Student Profile; OCR checks it against the uploaded image.
export const CURRENT_TERM = '1ST Semester 2026'
