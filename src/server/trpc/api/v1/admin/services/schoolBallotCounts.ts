import type { Db } from '@/server/trpc/init'
import type { SchoolBallotCount } from '../core/schoolBreakdown'

/**
 * Ballots per School snapshot and Registration status, in one query. Shared by the dashboard
 * turnout and the per-School Results; returns a PrismaPromise so it can join a batch
 * transaction. Prisma's groupBy can't group by the Registration's status, hence SQL.
 */
export function countBallotsBySchool(db: Db) {
  return db.$queryRaw<SchoolBallotCount[]>`
    SELECT b.school, r.status, COUNT(*)::int AS ballots
    FROM "Ballot" b
    JOIN "Registration" r ON r."personId" = b."personId"
    GROUP BY b.school, r.status
  `
}
