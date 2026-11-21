import type { RegistrationStatus } from '@/generated/prisma/client'
import { schoolBuckets, schoolLabel } from '@/server/trpc/api/v1/registration/core/school'
import type { SchoolTotals } from '../schema'

/** One row of countBallotsBySchool: Ballots per School snapshot and Registration status. */
export type SchoolBallotCount = {
  school: string | null
  status: RegistrationStatus
  ballots: number
}

/**
 * Ballot totals for every School to report on (see schoolBuckets). Only APPROVED Ballots are
 * counted; PENDING and REJECTED ones are Held Ballots.
 */
export function totalsBySchool(counts: readonly SchoolBallotCount[]): SchoolTotals[] {
  return schoolBuckets(counts.map((row) => row.school)).map((school) => {
    const ballots = (status: RegistrationStatus) =>
      counts.find((row) => row.school === school && row.status === status)?.ballots ?? 0
    return {
      school,
      label: schoolLabel(school),
      counted: ballots('APPROVED'),
      heldPending: ballots('PENDING'),
      heldRejected: ballots('REJECTED'),
    }
  })
}
