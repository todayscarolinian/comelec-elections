// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { ELECTION } from '@/election'
import { validateBallot } from '@/server/trpc/api/v1/ballot/core/validateBallot'

const single = ELECTION.questions[0]
const multiple = ELECTION.questions[1]

function ballot() {
  return {
    answers: Object.fromEntries(
      ELECTION.questions.map((question) => [question.id, { abstain: true }]),
    ) as Record<string, unknown>,
    disclosureAccepted: true,
  }
}

function withAnswer(questionId: string, answer: unknown) {
  const input = ballot()
  input.answers[questionId] = answer
  return input
}

describe('validateBallot', () => {
  it('accepts an Abstention for every Question', () => {
    const input = ballot()
    expect(validateBallot(input)).toEqual(input)
  })

  it('accepts a pick for every Question', () => {
    const input = ballot()
    for (const question of ELECTION.questions) {
      input.answers[question.id] = { candidateIds: [question.candidates[0].id] }
    }
    expect(validateBallot(input)).toEqual(input)
  })

  it('accepts mixed picks and Abstentions', () => {
    const input = withAnswer(single.id, { candidateIds: [single.candidates[0].id] })
    expect(validateBallot(input)).toEqual(input)
  })

  it('accepts one pick on a multi-choice Question', () => {
    const input = withAnswer(multiple.id, { candidateIds: [multiple.candidates[0].id] })
    expect(validateBallot(input)).toEqual(input)
  })

  it('accepts exactly the selection limit', () => {
    const input = withAnswer(multiple.id, {
      candidateIds: multiple.candidates.slice(0, multiple.selectionLimit).map(({ id }) => id),
    })
    expect(validateBallot(input)).toEqual(input)
  })

  it('rejects a missing Question', () => {
    const input = ballot()
    delete input.answers[single.id]
    expect(() => validateBallot(input)).toThrow(ZodError)
  })

  it('rejects an unknown Question', () => {
    expect(() => validateBallot(withAnswer('unknown-question', { abstain: true }))).toThrow(
      ZodError,
    )
  })

  it.each([
    ['empty picks', { candidateIds: [] }],
    ['over the selection limit', { candidateIds: single.candidates.map(({ id }) => id) }],
    ['unknown Candidate', { candidateIds: ['unknown-candidate'] }],
    ['cross-Question Candidate', { candidateIds: [multiple.candidates[0].id] }],
    ['picks plus Abstention', { abstain: true, candidateIds: [single.candidates[0].id] }],
    ['empty picks plus Abstention', { abstain: true, candidateIds: [] }],
    ['false Abstention', { abstain: false }],
    ['string Abstention', { abstain: 'true' }],
    ['picks plus false Abstention', { abstain: false, candidateIds: [single.candidates[0].id] }],
    ['neither answer variant', {}],
    ['null answer', null],
    ['array answer', []],
    ['string answer', 'abstain'],
    ['non-array picks', { candidateIds: single.candidates[0].id }],
    ['non-string Candidate ID', { candidateIds: [1] }],
    ['null Candidate ID', { candidateIds: [null] }],
    ['empty Candidate ID', { candidateIds: [''] }],
    ['unknown Abstention field', { abstain: true, extra: true }],
    ['unknown picks field', { candidateIds: [single.candidates[0].id], extra: true }],
  ])('rejects %s', (_, answer) => {
    expect(() => validateBallot(withAnswer(single.id, answer))).toThrow(ZodError)
  })

  it('rejects duplicate picks within the selection limit', () => {
    const id = multiple.candidates[0].id
    expect(() => validateBallot(withAnswer(multiple.id, { candidateIds: [id, id] }))).toThrow(
      ZodError,
    )
  })

  it('rejects picks above a multi-choice selection limit', () => {
    const candidateIds = Array.from(
      { length: multiple.selectionLimit + 1 },
      (_, index) => multiple.candidates[index % multiple.candidates.length].id,
    )
    expect(() => validateBallot(withAnswer(multiple.id, { candidateIds }))).toThrow(ZodError)
  })

  it.each([false, undefined, null, 'true', 1])('rejects disclosureAccepted=%s', (value) => {
    expect(() => validateBallot({ ...ballot(), disclosureAccepted: value })).toThrow(ZodError)
  })

  it('rejects omitted disclosure acceptance', () => {
    expect(() => validateBallot({ answers: ballot().answers })).toThrow(ZodError)
  })

  it.each([undefined, null, [], 'answers', {}])('rejects malformed answers: %s', (answers) => {
    expect(() => validateBallot({ answers, disclosureAccepted: true })).toThrow(ZodError)
  })

  it.each([undefined, null, [], 'ballot', true])('rejects malformed input: %s', (input) => {
    expect(() => validateBallot(input)).toThrow(ZodError)
  })

  it('rejects unknown submission fields', () => {
    expect(() => validateBallot({ ...ballot(), extra: true })).toThrow(ZodError)
  })

  it('does not mutate submitted answers or reorder picks', () => {
    const input = withAnswer(multiple.id, {
      candidateIds: multiple.candidates
        .slice(0, multiple.selectionLimit)
        .map(({ id }) => id)
        .reverse(),
    })
    const before = structuredClone(input)
    expect(validateBallot(input)).toEqual(before)
    expect(input).toEqual(before)
  })
})
