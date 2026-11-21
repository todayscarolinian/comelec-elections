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

  it('labels listed codes and keeps unlisted codes as stored', () => {
    expect(schoolLabel('SAS')).toBe('SAS')
    expect(schoolLabel('OLD_SCHOOL')).toBe('OLD_SCHOOL')
  })

  it('orders buckets: listed Schools, then unlisted codes sorted', () => {
    const schools = ['SAFAD', 'SAS', 'SBE', 'SED', 'SHCP', 'SLG', 'SOE']
    expect(schoolBuckets(['Z_OLD', 'SBE', 'A_OLD', 'Z_OLD'])).toEqual([
      ...schools,
      'A_OLD',
      'Z_OLD',
    ])
    expect(schoolBuckets([])).toEqual(schools)
  })
})
