// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))

import { ELECTION } from '@/election'
import type { Db } from '@/server/trpc/init'
import { getResultsBySchool } from '../services/resultsBySchool'

const [question] = ELECTION.questions
const [candidate] = question.candidates
const ADMIN = 'chair@example.com'

type CountRow = { school: string | null; _count: { _all: number } }

function setup({
  releasedAt = null as Date | null,
  counted = [] as CountRow[],
  pending = [] as CountRow[],
  rejected = [] as CountRow[],
  tally = [] as {
    school: string | null
    questionId: string
    candidateId: string | null
    votes: number
  }[],
} = {}) {
  const groupBy = vi.fn(
    async ({ where }: { where: { person: { registration: { is: { status: string } } } } }) => {
      const status = where.person.registration.is.status
      return status === 'APPROVED' ? counted : status === 'PENDING' ? pending : rejected
    },
  )
  const queryRaw = vi.fn(async (_strings: TemplateStringsArray) => tally)
  const auditCreate = vi.fn(async () => ({ id: 'audit-1' }))
  const db = {
    electionState: { findUnique: vi.fn(async () => ({ resultsReleasedAt: releasedAt })) },
    ballot: { groupBy },
    $queryRaw: queryRaw,
    auditLog: { create: auditCreate },
    $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  } as unknown as Db
  return { db, groupBy, queryRaw, auditCreate }
}

describe('getResultsBySchool', () => {
  it('splits counted votes by School and keeps Held Ballots out of the tally', async () => {
    const { db, queryRaw } = setup({
      counted: [
        { school: 'SCHOOL_A', _count: { _all: 2 } },
        { school: null, _count: { _all: 1 } },
      ],
      pending: [{ school: 'SCHOOL_A', _count: { _all: 1 } }],
      rejected: [{ school: 'SCHOOL_B', _count: { _all: 3 } }],
      tally: [
        { school: 'SCHOOL_A', questionId: question.id, candidateId: candidate.id, votes: 2 },
        { school: null, questionId: question.id, candidateId: null, votes: 1 },
      ],
    })

    const rows = await getResultsBySchool(db, ADMIN)

    expect(rows.map((row) => [row.school, row.label])).toEqual([
      ['SCHOOL_A', 'School A'],
      ['SCHOOL_B', 'School B'],
      ['SCHOOL_C', 'School C'],
      [null, 'Not recorded'],
    ])
    const schoolA = rows[0].results
    expect(schoolA).toMatchObject({ countedBallots: 2, heldPending: 1, heldRejected: 0 })
    expect(schoolA.questions[0].candidates[0]).toMatchObject({ id: candidate.id, votes: 2 })
    expect(rows[1].results).toMatchObject({ countedBallots: 0, heldPending: 0, heldRejected: 3 })
    expect(rows[1].results.questions[0].candidates.every((c) => c.votes === 0)).toBe(true)
    expect(rows[3].results.questions[0].abstentions).toBe(1)

    const sql = (queryRaw.mock.calls[0][0] as TemplateStringsArray).join('?')
    expect(sql).toMatch(/JOIN "Registration" r ON r."personId" = b."personId"/)
    expect(sql).toMatch(/WHERE r.status = 'APPROVED'/)
    expect(sql).toMatch(/GROUP BY b.school, a."questionId", a."candidateId"/)
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
