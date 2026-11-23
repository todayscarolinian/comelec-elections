// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { OcrBox } from '../engine'
import { extractFields, extractTerm, matchFields } from '../fields'

const H = 20

function box(text: string, x: number, cy: number, width = text.length * 11): OcrBox {
  return { text, score: 0.98, x0: x, x1: x + width, y0: cy - H / 2, y1: cy + H / 2 }
}

const TERM = '1st Semester 2026'

const desktop: OcrBox[] = [
  box('Student Profile', 230, 110),
  box('1ST Semester 2026', 260, 180),
  box('Full Name', 260, 240),
  box('JUAN MIGUEL B. DELA CRUZ', 520, 240),
  box('Student ID', 260, 300),
  box('01234567', 520, 300),
  box('Year Level', 260, 360),
  box('3', 520, 360),
  box('Birth Date', 260, 420),
  box('JANUARY 1, 2000', 520, 420),
]

const juan = { name: 'Juan Dela Cruz', studentId: '01234567', yearLevel: '3', term: TERM }

describe('extractFields', () => {
  it('reads each value from the right of its label', () => {
    expect(extractFields(desktop)).toEqual({
      name: 'JUAN MIGUEL B. DELA CRUZ',
      studentId: '01234567',
      yearLevel: '3',
      term: '1st semester 2026',
    })
  })

  it('reads a name wrapped across two lines with the label between them', () => {
    const mobile = [
      box('Full Name', 40, 200),
      box('JUAN MIGUEL B.', 200, 186),
      box('DELA CRUZ', 200, 214),
      box('Student ID', 40, 260),
      box('01234567', 200, 260),
    ]
    expect(extractFields(mobile).name).toBe('JUAN MIGUEL B. DELA CRUZ')
    expect(matchFields(extractFields(mobile), { name: 'Juan Dela Cruz' }).name).toBe(true)
  })

  it('reads a value in the same box as its label', () => {
    expect(extractFields([box('Student ID: 01234567', 40, 100)]).studentId).toBe('01234567')
  })

  it('leaves a field empty when its label is missing', () => {
    const noYearLevel = desktop.filter((b) => b.text !== 'Year Level' && b.text !== '3')
    const fields = extractFields(noYearLevel)
    expect(fields.yearLevel).toBe('')
    expect(matchFields(fields, juan).yearLevel).toBe(false)
  })
})

describe('extractTerm', () => {
  it.each([
    ['1ST Semester 2026', '1st semester 2026'],
    ['FIRST SEMESTER 2026', '1st semester 2026'],
    ['2nd Sem 2026', '2nd semester 2026'],
    ['Summer 2026', 'summer 2026'],
  ])('reads %s', (text, term) => {
    expect(extractTerm(text)).toBe(term)
  })

  it('returns an empty string without a term', () => {
    expect(extractTerm('Student Profile')).toBe('')
  })
})

describe('matchFields', () => {
  it('matches the Applicant whose profile it is', () => {
    expect(matchFields(extractFields(desktop), juan)).toEqual({
      name: true,
      studentId: true,
      yearLevel: true,
      term: true,
    })
  })

  it('allows a small spelling difference in a name', () => {
    const fields = extractFields(desktop)
    expect(matchFields(fields, { name: 'Juan Miguell Dela Cruz' }).name).toBe(true)
  })

  it('compares student IDs as text so a leading zero counts', () => {
    const fields = extractFields(desktop)
    expect(matchFields(fields, { studentId: '01234567' }).studentId).toBe(true)
    expect(matchFields(fields, { studentId: '1234567' }).studentId).toBe(false)
  })

  it("rejects another student's details", () => {
    const maria = { name: 'Maria Clara Santos', studentId: '07654321', yearLevel: '1', term: TERM }
    expect(matchFields(extractFields(desktop), maria)).toEqual({
      name: false,
      studentId: false,
      yearLevel: false,
      term: true,
    })
  })

  it('rejects a different term', () => {
    expect(matchFields(extractFields(desktop), { term: '2nd Semester 2026' }).term).toBe(false)
  })

  it('matches a Graduate Year Level by name rather than digits', () => {
    const fields = { name: '', studentId: '', term: '' }
    expect(
      matchFields({ ...fields, yearLevel: 'Graduate' }, { yearLevel: 'GRADUATE' }).yearLevel,
    ).toBe(true)
    expect(matchFields({ ...fields, yearLevel: '' }, { yearLevel: 'GRADUATE' }).yearLevel).toBe(
      false,
    )
    expect(matchFields({ ...fields, yearLevel: '1' }, { yearLevel: 'GRADUATE' }).yearLevel).toBe(
      false,
    )
  })
})
