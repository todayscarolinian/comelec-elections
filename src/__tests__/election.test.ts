import { describe, expect, it } from 'vitest'
import { ELECTION, PARTIES, type CandidateDef } from '@/election'

const candidates = ELECTION.questions.flatMap<CandidateDef>((question) => question.candidates)

describe('ELECTION', () => {
  it('lists the verified candidates for each office in ballot-number order', () => {
    expect(
      ELECTION.questions.map((question) => [
        question.id,
        question.selectionLimit,
        question.candidates.map(({ id }) => id),
      ]),
    ).toEqual([
      ['president', 1, ['mark-lawrence-gavas', 'dyane-jhen-wagas']],
      ['vice-president', 1, ['monica-denise-rodriguez', 'princess-jannah-ungab']],
      [
        'councilors',
        11,
        [
          'andrie-levy-arizobal',
          'briar-cymone-cuizon',
          'ravioli-bueri-blanc-gabales',
          'tristan-jude-gacrama',
          'adam-zachary-gaviola',
          'yoshua-luke-majam',
          'kent-deloria-reyes',
          'renie-jr-rizaldo',
          'sean-joseph-solibaga',
          'weighne-princess-tan',
          'peter-allan-vilbar',
        ],
      ],
    ])
  })

  it('has unique Question ids', () => {
    const ids = ELECTION.questions.map((question) => question.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique Candidate ids', () => {
    const ids = candidates.map((candidate) => candidate.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('references only configured Parties', () => {
    const partyIds = new Set(PARTIES)

    for (const candidate of candidates) {
      if (candidate.party !== undefined) {
        expect(partyIds.has(candidate.party)).toBe(true)
      }
    }
  })

  it('has valid Selection Limits', () => {
    for (const question of ELECTION.questions) {
      expect(question.selectionLimit).toBeGreaterThanOrEqual(1)
      expect(question.selectionLimit).toBeLessThanOrEqual(question.candidates.length)
    }
  })
})
