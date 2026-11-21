// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isSchool, schoolBuckets, schoolLabel } from '../core/school'

describe('School', () => {
  it.each([
    ['SAFAD', true],
    ['safad', false],
    ['', false],
    [null, false],
    [undefined, false],
  ] as const)('isSchool(%j) is %s', (value, expected) => {
    expect(isSchool(value)).toBe(expected)
  })

  it('labels listed codes, keeps unlisted codes as stored and names a missing School', () => {
    expect(schoolLabel('SAS')).toBe('SAS')
    expect(schoolLabel('OLD_SCHOOL')).toBe('OLD_SCHOOL')
    expect(schoolLabel(null)).toBe('Not recorded')
  })

  it('orders buckets: listed Schools, then unlisted codes sorted, then a missing School', () => {
    const schools = ['SAFAD', 'SAS', 'SBE', 'SED', 'SHCP', 'SLG', 'SOE']
    expect(schoolBuckets(['Z_OLD', null, 'SBE', 'A_OLD', 'Z_OLD'])).toEqual([
      ...schools,
      'A_OLD',
      'Z_OLD',
      null,
    ])
    expect(schoolBuckets([])).toEqual(schools)
  })
})
