// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { turnoutBySchool } from '../core/turnoutBySchool'

describe('turnoutBySchool', () => {
  it('lists every School in order with zeros, keeping counted and held apart', () => {
    expect(
      turnoutBySchool(
        [{ school: 'SCHOOL_B', ballots: 7 }],
        [
          { school: 'SCHOOL_B', ballots: 2 },
          { school: 'SCHOOL_A', ballots: 1 },
        ],
      ),
    ).toEqual([
      { school: 'SCHOOL_A', label: 'School A', counted: 0, held: 1 },
      { school: 'SCHOOL_B', label: 'School B', counted: 7, held: 2 },
      { school: 'SCHOOL_C', label: 'School C', counted: 0, held: 0 },
    ])
  })

  it('adds a Not recorded row only when some Ballots have no School', () => {
    const rows = turnoutBySchool([{ school: null, ballots: 4 }], [])
    expect(rows.at(-1)).toEqual({ school: null, label: 'Not recorded', counted: 4, held: 0 })
    expect(turnoutBySchool([], []).some((row) => row.school === null)).toBe(false)
  })

  it('keeps stored codes that are no longer in the School list, after the listed Schools', () => {
    const rows = turnoutBySchool([{ school: 'OLD_SCHOOL', ballots: 3 }], [])
    expect(rows.map((row) => row.school)).toEqual([
      'SCHOOL_A',
      'SCHOOL_B',
      'SCHOOL_C',
      'OLD_SCHOOL',
    ])
    expect(rows.at(-1)).toMatchObject({ label: 'OLD_SCHOOL', counted: 3 })
  })
})
