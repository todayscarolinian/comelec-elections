// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))

import { ELECTION } from '@/election'
import type { Db } from '@/server/trpc/init'
import type { SchoolBallotCount } from '../core/schoolBreakdown'
import { getResultsBySchool } from '../services/resultsBySchool'

const [question] = ELECTION.questions
const [candidate] = question.candidates
const ADMIN = 'chair@example.com'

type TallyRow = {
  school: string | null
  questionId: string
  candidateId: string | null
  votes: number
}

function setup({
  releasedAt = null as Date | null,
  counts = [] as SchoolBallotCount[],
  tally = [] as TallyRow[],
} = {}) {
  // Two raw queries run in the batch: Ballot counts by (school, status), then the tally.
  const queryRaw = vi.fn(async (strings: TemplateStringsArray) =>
    strings.join('?').includes('"BallotAnswer"') ? tally : counts,
  )
  const auditCreate = vi.fn(async () => ({ id: 'audit-1' }))
  const db = {
    electionState: { findUnique: vi.fn(async () => ({ resultsReleasedAt: releasedAt })) },
    $queryRaw: queryRaw,
    auditLog: { create: auditCreate },
    $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  } as unknown as Db
  return { db, queryRaw, auditCreate }
}

describe('getResultsBySchool', () => {
  it('splits counted votes by School and keeps Held Ballots out of the tally', async () => {
    const { db, queryRaw } = setup({
      counts: [
        { school: 'SAFAD', status: 'APPROVED', ballots: 2 },
        { school: 'SAFAD', status: 'PENDING', ballots: 1 },
        { school: 'SAS', status: 'REJECTED', ballots: 3 },
        { school: null, status: 'APPROVED', ballots: 1 },
      ],
      tally: [
        { school: 'SAFAD', questionId: question.id, candidateId: candidate.id, votes: 2 },
        { school: null, questionId: question.id, candidateId: null, votes: 1 },
      ],
    })

    const rows = await getResultsBySchool(db, ADMIN)

    expect(rows.map((row) => [row.school, row.label])).toEqual([
      ['SAFAD', 'SAFAD'],
      ['SAS', 'SAS'],
      ['SBE', 'SBE'],
      ['SED', 'SED'],
      ['SHCP', 'SHCP'],
      ['SLG', 'SLG'],
      ['SOE', 'SOE'],
      [null, 'Not recorded'],
    ])
    const schoolA = rows[0].results
    expect(schoolA).toMatchObject({ countedBallots: 2, heldPending: 1, heldRejected: 0 })
    expect(schoolA.questions[0].candidates[0]).toMatchObject({ id: candidate.id, votes: 2 })
    expect(rows[1].results).toMatchObject({ countedBallots: 0, heldPending: 0, heldRejected: 3 })
    expect(rows[1].results.questions[0].candidates.every((c) => c.votes === 0)).toBe(true)
    expect(rows.at(-1)?.results.questions[0].abstentions).toBe(1)

    const [countSql, tallySql] = queryRaw.mock.calls.map(([strings]) =>
      (strings as TemplateStringsArray).join('?'),
    )
    expect(countSql).toMatch(/GROUP BY b.school, r.status/)
    expect(tallySql).toMatch(/JOIN "Registration" r ON r."personId" = b."personId"/)
    expect(tallySql).toMatch(/WHERE r.status = 'APPROVED'/)
    expect(tallySql).toMatch(/GROUP BY b.school, a."questionId", a."candidateId"/)
  })

  it('audits a view before Results are released', async () => {
    const { db, auditCreate } = setup()

    await getResultsBySchool(db, ADMIN)

    expect(auditCreate).toHaveBeenCalledExactlyOnceWith({
      data: {
        adminEmail: ADMIN,
        action: 'VIEW_RESULTS',
        target: 'main',
        detail: { bySchool: true },
      },
    })
  })

  it('does not audit once Results are released', async () => {
    const releasedAt = new Date('2026-11-24T10:00:00Z')
    const { db, auditCreate } = setup({ releasedAt })

    const rows = await getResultsBySchool(db, ADMIN)

    expect(auditCreate).not.toHaveBeenCalled()
    expect(rows[0].results.releasedAt).toEqual(releasedAt)
  })
})
