import type { OcrBox } from './engine'

const TOKEN_MATCH_THRESHOLD = 0.85
const TERM_RE = /\b(1st|2nd|first|second|summer)\s*(semester|sem|term)?\s*((?:19|20)\d{2})\b/

export const LABELS = {
  name: 'full name',
  studentId: 'student id',
  yearLevel: 'year level',
} as const

export type ProfileFields = { name: string; studentId: string; yearLevel: string; term: string }

export type ExpectedFields = Partial<ProfileFields>

export type FieldMatches = {
  name: boolean | null
  studentId: boolean | null
  yearLevel: boolean | null
  term: boolean | null
}

export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function similar(a: string, b: string): number {
  const total = a.length + b.length
  return total ? (2 * matchingChars(a, b)) / total : 1
}

function matchingChars(a: string, b: string): number {
  let best = 0
  let bestI = 0
  let bestJ = 0
  let prev = new Array<number>(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1).fill(0)
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        row[j] = prev[j - 1] + 1
        if (row[j] > best) {
          best = row[j]
          bestI = i - best
          bestJ = j - best
        }
      }
    }
    prev = row
  }
  if (!best) return 0
  return (
    best +
    matchingChars(a.slice(0, bestI), b.slice(0, bestJ)) +
    matchingChars(a.slice(bestI + best), b.slice(bestJ + best))
  )
}

type Geo = { text: string; x0: number; x1: number; cy: number; h: number }

const toGeo = (b: OcrBox): Geo => ({
  text: b.text,
  x0: b.x0,
  x1: b.x1,
  cy: (b.y0 + b.y1) / 2,
  h: b.y1 - b.y0,
})

export function valueRightOf(label: string, ocrBoxes: OcrBox[]): string {
  const boxes = ocrBoxes.map(toGeo)
  for (const box of boxes) {
    const norm = normalize(box.text)
    if (norm.startsWith(label) && norm.length > label.length + 1) {
      return box.text.slice(label.length).replace(/^[\s:]+|[\s:]+$/g, '')
    }
  }
  const candidates = boxes.filter((b) => similar(normalize(b.text), label) >= TOKEN_MATCH_THRESHOLD)
  for (const lb of candidates) {
    const column = boxes
      .filter((b) => Math.abs(b.x0 - lb.x0) < lb.h * 1.5 && b.x1 < lb.x1 + lb.h * 3)
      .sort((a, b) => a.cy - b.cy)
    const above = column.filter((b) => b.cy < lb.cy - lb.h * 0.5).map((b) => b.cy)
    const below = column.filter((b) => b.cy > lb.cy + lb.h * 0.5).map((b) => b.cy)
    const top = Math.max(
      above.length ? (above[above.length - 1] + lb.cy) / 2 : 0,
      lb.cy - lb.h * 1.5,
    )
    const bottom = Math.min(below.length ? (below[0] + lb.cy) / 2 : Infinity, lb.cy + lb.h * 1.5)
    let value = boxes.filter((b) => b.x0 > lb.x1 && top < b.cy && b.cy < bottom)
    if (value.length) {
      const nearestX = Math.min(...value.map((b) => b.x0))
      value = value.filter((b) => b.x0 < nearestX + lb.h * 4)
      return value
        .sort((a, b) => a.cy - b.cy || a.x0 - b.x0)
        .map((b) => b.text)
        .join(' ')
        .replace(/^[\s:]+|[\s:]+$/g, '')
    }
  }
  return ''
}

export function extractTerm(text: string): string {
  const match = TERM_RE.exec(normalize(text))
  if (!match) return ''
  const ordinal = ({ first: '1st', second: '2nd' } as Record<string, string>)[match[1]] ?? match[1]
  return ordinal === 'summer' ? `summer ${match[3]}` : `${ordinal} semester ${match[3]}`
}

export function extractFields(boxes: OcrBox[]): ProfileFields {
  return {
    name: valueRightOf(LABELS.name, boxes),
    studentId: valueRightOf(LABELS.studentId, boxes),
    yearLevel: valueRightOf(LABELS.yearLevel, boxes),
    term: extractTerm(boxes.map((b) => b.text).join('\n')),
  }
}

const digits = (text: string) => text.replace(/\D/g, '')

export function nameMatches(expected: string, extracted: string): boolean {
  const got = normalize(extracted).split(' ').filter(Boolean)
  const want = normalize(expected).split(' ').filter(Boolean)
  return (
    want.length > 0 && want.every((t) => got.some((g) => similar(t, g) >= TOKEN_MATCH_THRESHOLD))
  )
}

export function matchFields(fields: ProfileFields, expected: ExpectedFields): FieldMatches {
  const wantTerm = expected.term ? extractTerm(expected.term) || normalize(expected.term) : ''
  return {
    name: expected.name ? nameMatches(expected.name, fields.name) : null,
    studentId: expected.studentId ? digits(fields.studentId) === digits(expected.studentId) : null,
    yearLevel: expected.yearLevel ? digits(fields.yearLevel) === digits(expected.yearLevel) : null,
    term: expected.term ? Boolean(fields.term) && similar(fields.term, wantTerm) >= 0.9 : null,
  }
}
