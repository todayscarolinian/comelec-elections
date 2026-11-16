// ballot/__tests__/deriveMyStatus.test.ts  (pure, no mocks)
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { deriveMyStatus } from '../core/myStatus'

describe('deriveMyStatus', () => {
  it.each([
    [null, false, 'not_registered'],
    ['PENDING', false, 'held'],
    ['REJECTED', false, 'held'],
    ['APPROVED', false, 'can_vote'],
    ['APPROVED', true, 'already_voted'],
    ['PENDING', true, 'already_voted'], // held Ballot already cast
    ['REJECTED', true, 'already_voted'],
    [null, true, 'already_voted'], // should not happen, but a Ballot always wins
  ] as const)('registration=%s, ballot=%s -> %s', (registrationStatus, hasBallot, expected) => {
    expect(deriveMyStatus({ registrationStatus, hasBallot })).toBe(expected)
  })
})
