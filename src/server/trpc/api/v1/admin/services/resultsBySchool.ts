import { ELECTION } from '@/election'
import type { Db } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
import { buildResults, type TallyRow } from '@/server/trpc/api/v1/results/core/buildResults'
import { totalsBySchool } from '../core/schoolBreakdown'
import { countBallotsBySchool } from './schoolBallotCounts'

type SchoolTallyRow = TallyRow & { school: string | null }

/**
 * Results split by the School snapshot on each Ballot, with the same counting rule as the
 * overall Results. Pre-release views are audited like VIEW_RESULTS; adminProcedure has
 * already checked the caller.
 */
export async function getResultsBySchool(db: Db, adminEmail: string) {
  const [state, counts, tally] = await db.$transaction([
    db.electionState.findUnique({ where: { id: 'main' }, select: { resultsReleasedAt: true } }),
    countBallotsBySchool(db),
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

  return totalsBySchool(counts).map(({ school, label, counted, heldPending, heldRejected }) => ({
    school,
    label,
    results: buildResults({
      election: ELECTION,
      tally: tally.filter((row) => row.school === school),
      countedBallots: counted,
      heldPending,
      heldRejected,
      releasedAt,
    }),
  }))
}
