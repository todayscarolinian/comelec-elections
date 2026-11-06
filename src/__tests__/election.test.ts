import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ELECTION, type CandidateDef } from '@/election'

const candidates = ELECTION.questions.flatMap<CandidateDef>((question) => question.candidates)

describe('ELECTION', () => {
  it('has unique Question ids', () => {
    const ids = ELECTION.questions.map((question) => question.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique Candidate ids', () => {
    const ids = candidates.map((candidate) => candidate.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has valid Selection Limits', () => {
    for (const question of ELECTION.questions) {
      expect(question.selectionLimit).toBeGreaterThanOrEqual(1)
      expect(question.selectionLimit).toBeLessThanOrEqual(question.candidates.length)
    }
  })

  it('references Candidate photos under public/candidates', () => {
    for (const candidate of candidates) {
      expect(candidate.photo).toMatch(/^\/candidates\/[^/]+$/)

      const relativePath = candidate.photo.replace(/^\/+/, '')
      const absolutePath = resolve(process.cwd(), 'public', relativePath)

      expect(existsSync(absolutePath)).toBe(true)
    }
  })
})
