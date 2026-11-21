import type { Prisma } from '@/generated/prisma/client'
import { ELECTION } from '@/election'
import type { Db } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
import { buildResults, type TallyRow } from '@/server/trpc/api/v1/results/core/buildResults'
import { turnoutBySchool, type SchoolCountRow } from '../core/turnoutBySchool'

type SchoolTallyRow = TallyRow & { school: string | null }

const withStatus = (status: 'APPROVED' | 'PENDING' | 'REJECTED'): Prisma.BallotWhereInput => ({
  person: { registration: { is: { status } } },
})

function countRows(
  rows: readonly { school: string | null; _count: true | { _all?: number } }[],
): SchoolCountRow[] {
  return rows.map((row) => ({
    school: row.school,
    ballots: typeof row._count === 'object' ? (row._count._all ?? 0) : 0,
  }))
}

/**
 * Results split by the School snapshot on each Ballot. Only Ballots whose Registration is
 * APPROVED are counted, as in the overall Results. Pre-release views are audited like
 * VIEW_RESULTS; the caller is already checked by adminProcedure.
 */
export async function getResultsBySchool(db: Db, adminEmail: string) {
  const groupBySchool = (where: Prisma.BallotWhereInput) =>
    db.ballot.groupBy({
      by: ['school'],
      where,
      orderBy: { school: 'asc' },
      _count: { _all: true },
    })

  const [state, counted, pending, rejected, tally] = await db.$transaction([
    db.electionState.findUnique({ where: { id: 'main' }, select: { resultsReleasedAt: true } }),
    groupBySchool(withStatus('APPROVED')),
    groupBySchool(withStatus('PENDING')),
    groupBySchool(withStatus('REJECTED')),
    // groupBy can't group BallotAnswer by a column on its Ballot, so join in SQL.
    db.$queryRaw<SchoolTallyRow[]>`
      SELECT b.school, a."questionId", a."candidateId", COUNT(*)::int AS votes
      FROM "BallotAnswer" a
      JOIN "Ballot" b ON b.id = a."ballotId"
      JOIN "Registration" r ON r."personId" = b."personId"
      WHERE r.status = 'APPROVED'
      GROUP BY b.school, a."questionId", a."candidateId"
    `,
  ])
  const releasedAt = state?.resultsReleasedAt ?? null

  if (!releasedAt) {
    await writeAudit(
      { adminEmail, action: 'VIEW_RESULTS', target: 'main', detail: { bySchool: true } },
      db,
    )
  }

  const pendingBy = new Map(countRows(pending).map((row) => [row.school, row.ballots]))
  const rejectedBy = new Map(countRows(rejected).map((row) => [row.school, row.ballots]))
  const heldRows = [...countRows(pending), ...countRows(rejected)]

  return turnoutBySchool(countRows(counted), heldRows).map(({ school, label, counted }) => ({
    school,
    label,
    results: buildResults({
      election: ELECTION,
      tally: tally.filter((row) => row.school === school),
      countedBallots: counted,
      heldPending: pendingBy.get(school) ?? 0,
      heldRejected: rejectedBy.get(school) ?? 0,
      releasedAt,
    }),
  }))
}
