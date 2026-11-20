// ballot/__tests__/deriveMyStatus.test.ts  (pure, no mocks)
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { deriveMyStatus } from '../core/myStatus'

describe('deriveMyStatus', () => {
  it.each([
    [null, false, 'not_registered'],
    ['PENDING', false, 'can_vote'],
    ['REJECTED', false, 'can_vote'],
    ['APPROVED', false, 'can_vote'],
    ['APPROVED', true, 'already_voted'],
    ['PENDING', true, 'held'],
    ['REJECTED', true, 'held'],
    [null, true, 'held'], // impossible in practice; a Ballot with no approved Registration is held
  ] as const)('registration=%s, ballot=%s -> %s', (registrationStatus, hasBallot, expected) => {
    expect(deriveMyStatus({ registrationStatus, hasBallot })).toBe(expected)
  })
})
