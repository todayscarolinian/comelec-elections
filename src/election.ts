export const PARTIES = ['STAND', 'TINGOG!', 'SPP'] as const

export type PartyId = (typeof PARTIES)[number]

export type CandidateDef = {
  readonly id: string // stable, never changes once the Election has opened
  readonly name: string
  readonly party?: PartyId // Omitted means that the Candidate is Independent
}

export type QuestionDef = {
  readonly id: string // stable, never changes once the Election has opened
  readonly title: string
  readonly selectionLimit: number // 1 = single choice
  readonly candidates: readonly CandidateDef[] // display order = array order
}

export type ElectionDef = {
  readonly id: string
  readonly title: string
  readonly questions: readonly QuestionDef[]
}

function candidates(entries: readonly (readonly [id: string, name: string, party?: PartyId])[]) {
  return entries.map(([id, name, party]) => ({ id, name, party }))
}

// Listed in verified ballot-number order. Profile content lives in the public directory.
const councilors = candidates([
  ['andrie-levy-arizobal', 'Arizobal, Andrie Levy', 'TINGOG!'],
  ['briar-cymone-cuizon', 'Cuizon, Briar Cymone', 'TINGOG!'],
  ['ravioli-bueri-blanc-gabales', 'Gabales, Ravioli Bueri Blanc Manayaga', 'TINGOG!'],
  ['tristan-jude-gacrama', 'Gacrama, Tristan Jude G.', 'SPP'],
  ['adam-zachary-gaviola', 'Gaviola, Adam Zachary D.', 'STAND'],
  ['yoshua-luke-majam', 'Majam, Yoshua Luke Lobitonia', 'TINGOG!'],
  ['kent-deloria-reyes', 'Reyes, Kent Deloria', 'TINGOG!'],
  ['renie-jr-rizaldo', 'Rizaldo, Renie Jr. D.', 'SPP'],
  ['sean-joseph-solibaga', 'Solibaga, Sean Joseph', 'TINGOG!'],
  ['weighne-princess-tan', 'Tan, Weighne Princess', 'TINGOG!'],
  ['peter-allan-vilbar', 'Vilbar, Peter Allan', 'TINGOG!'],
])

// These IDs become persisted Ballot references once the Election opens.
// Question and Candidate ids must never be renamed or removed after that point.
export const ELECTION = {
  id: 'main',
  title: 'Supreme Student Council Elections 2026',
  questions: [
    {
      id: 'president',
      title: 'President',
      selectionLimit: 1,
      candidates: candidates([
        ['mark-lawrence-gavas', 'Gavas, Mark Lawrence L.', 'TINGOG!'],
        ['dyane-jhen-wagas', 'Wagas, Dyane Jhen P.', 'STAND'],
      ]),
    },
    {
      id: 'vice-president',
      title: 'Vice President',
      selectionLimit: 1,
      candidates: candidates([
        ['monica-denise-rodriguez', 'Rodriguez, Monica Denise T.', 'STAND'],
        ['princess-jannah-ungab', 'Ungab, Princess Jannah', 'TINGOG!'],
      ]),
    },
    {
      id: 'councilors',
      title: 'Councilors',
      selectionLimit: Math.min(21, councilors.length),
      candidates: councilors,
    },
  ],
} as const satisfies ElectionDef

// Term printed on the Student Profile; OCR checks it against the uploaded image.
export const CURRENT_TERM = '1ST Semester 2026'
