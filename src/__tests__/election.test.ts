import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ELECTION, PARTIES, type CandidateDef } from '@/election'
import { CANDIDATE_OFFICES, CANDIDATES } from '@/lib/candidates'

const candidates = ELECTION.questions.flatMap<CandidateDef>((question) => question.candidates)

describe('ELECTION', () => {
  it('uses the 15 verified ballot candidates in ballot-number order', () => {
    expect(ELECTION.questions.map(({ id, selectionLimit }) => [id, selectionLimit])).toEqual([
      ['president', 1],
      ['vice-president', 1],
      ['councilors', 11],
    ])
    expect(candidates).toHaveLength(15)
    for (const [index, question] of ELECTION.questions.entries()) {
      const office = CANDIDATE_OFFICES[index]
      expect(question.id).toBe(office.id)
      expect(question.candidates).toEqual(
        [...office.candidates]
          .sort((a, b) => a.number - b.number)
          .map(({ id, name, party }) => ({ id, name, party })),
      )
    }
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

  it('has a public portrait on disk for every ballot candidate', () => {
    for (const candidate of candidates) {
      const photo = CANDIDATES.find(({ id }) => id === (candidate.profileId ?? candidate.id))?.photo
      expect(photo).toMatch(/^\/candidates\//)
      const relativePath = decodeURIComponent(photo!).slice(1)
      const absolutePath = resolve(process.cwd(), 'public', relativePath)

      expect(existsSync(absolutePath)).toBe(true)
    }
  })
})
