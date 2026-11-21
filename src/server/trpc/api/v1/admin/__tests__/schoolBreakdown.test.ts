// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { totalsBySchool } from '../core/schoolBreakdown'

describe('totalsBySchool', () => {
  it('lists every School with zeros, splitting counted, pending and rejected Ballots', () => {
    expect(
      totalsBySchool([
        { school: 'SAS', status: 'APPROVED', ballots: 7 },
        { school: 'SAS', status: 'PENDING', ballots: 2 },
        { school: 'SAFAD', status: 'REJECTED', ballots: 1 },
      ]),
    ).toEqual([
      { school: 'SAFAD', label: 'SAFAD', counted: 0, heldPending: 0, heldRejected: 1 },
      { school: 'SAS', label: 'SAS', counted: 7, heldPending: 2, heldRejected: 0 },
      { school: 'SBE', label: 'SBE', counted: 0, heldPending: 0, heldRejected: 0 },
      { school: 'SED', label: 'SED', counted: 0, heldPending: 0, heldRejected: 0 },
      { school: 'SHCP', label: 'SHCP', counted: 0, heldPending: 0, heldRejected: 0 },
      { school: 'SLG', label: 'SLG', counted: 0, heldPending: 0, heldRejected: 0 },
      { school: 'SOE', label: 'SOE', counted: 0, heldPending: 0, heldRejected: 0 },
    ])
  })

  it('adds a Not recorded row only when some Ballots have no School', () => {
    expect(totalsBySchool([{ school: null, status: 'APPROVED', ballots: 4 }]).at(-1)).toEqual({
      school: null,
      label: 'Not recorded',
      counted: 4,
      heldPending: 0,
      heldRejected: 0,
    })
    expect(totalsBySchool([]).some((row) => row.school === null)).toBe(false)
  })
})
