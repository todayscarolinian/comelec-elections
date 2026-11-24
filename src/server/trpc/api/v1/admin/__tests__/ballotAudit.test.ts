// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { ElectionDef } from '@/election'
import { ballotAuditStatus, ballotChoices, ballotsCsv } from '../core/ballotAudit'
import { dashboardPhase } from '../core/dashboardPhase'

const election: ElectionDef = {
  id: 'main',
  title: 'Test',
  questions: [
    {
      id: 'q1',
      title: 'President',
      selectionLimit: 1,
      candidates: [
        { id: 'a', name: 'Ana' },
        { id: 'b', name: 'Ben' },
      ],
    },
    {
      id: 'q2',
      title: 'Councilors',
      selectionLimit: 2,
      candidates: [
        { id: 'c', name: 'Cy' },
        { id: 'd', name: 'Di' },
      ],
    },
  ],
}

describe('ballotChoices', () => {
  it('resolves picks to names in config order and marks abstentions', () => {
    expect(
      ballotChoices(election, [
        { questionId: 'q2', candidateId: 'd' },
        { questionId: 'q2', candidateId: 'c' },
        { questionId: 'q1', candidateId: null },
      ]),
    ).toEqual([
      { questionId: 'q1', questionTitle: 'President', abstained: true, candidates: [] },
      { questionId: 'q2', questionTitle: 'Councilors', abstained: false, candidates: ['Cy', 'Di'] },
    ])
  })
})

describe('ballotAuditStatus', () => {
  it.each([
    ['APPROVED', 'COUNTED'],
    ['PENDING', 'HELD_PENDING'],
    ['REJECTED', 'HELD_REJECTED'],
    [undefined, 'HELD_PENDING'],
  ] as const)('maps %s to %s', (registration, status) => {
    expect(ballotAuditStatus(registration)).toBe(status)
  })
})

describe('ballotsCsv', () => {
  const castAt = new Date('2026-11-24T01:00:00Z')

  it('writes one column per Question and quotes special characters', () => {
    const csv = ballotsCsv(election, [
      {
        name: 'Dela Cruz, Juan "JD"',
        email: 'jd@example.com',
        yearLevel: '3',
        castAt,
        status: 'COUNTED',
        choices: ballotChoices(election, [
          { questionId: 'q1', candidateId: 'a' },
          { questionId: 'q2', candidateId: 'c' },
          { questionId: 'q2', candidateId: 'd' },
        ]),
      },
    ])
    expect(csv.split('\r\n')).toEqual([
      'Name,Email,Year level,Cast at,Status,President,Councilors',
      '"Dela Cruz, Juan ""JD""",jd@example.com,3,2026-11-24T01:00:00.000Z,COUNTED,Ana,Cy; Di',
      '',
    ])
  })

  it('neutralises values a spreadsheet would run as formulas', () => {
    const csv = ballotsCsv(election, [
      {
        name: '=HYPERLINK("http://x")',
        email: '+1@example.com',
        yearLevel: '1',
        castAt,
        status: 'HELD_PENDING',
        choices: ballotChoices(election, [
          { questionId: 'q1', candidateId: null },
          { questionId: 'q2', candidateId: null },
        ]),
      },
    ])
    const row = csv.split('\r\n')[1]
    expect(row.startsWith(`"'=HYPERLINK(""http://x"")",'+1@example.com,`)).toBe(true)
    expect(row.endsWith(',Abstain,Abstain')).toBe(true)
  })
})

describe('dashboardPhase', () => {
  const released = new Date('2026-11-24T10:00:00Z')

  it.each([
    [
      { electionStatus: 'CLOSED', resultsReleasedAt: null, hasVotingOpened: false },
      'BEFORE_VOTING',
    ],
    [{ electionStatus: 'OPEN', resultsReleasedAt: null, hasVotingOpened: true }, 'VOTING_OPEN'],
    [{ electionStatus: 'CLOSED', resultsReleasedAt: null, hasVotingOpened: true }, 'VOTING_CLOSED'],
    [{ electionStatus: 'CLOSED', resultsReleasedAt: released, hasVotingOpened: true }, 'RELEASED'],
  ] as const)('%o is %s', (input, phase) => {
    expect(dashboardPhase(input)).toBe(phase)
  })
})
