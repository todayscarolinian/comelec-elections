import { TRPCError } from '@trpc/server'
import type { Db } from '@/server/trpc/init'
import type { School } from '../core/school'

/**
 * One-time School answer for Registrations made before School was collected. Once set, only
 * an Admin can change it (on approval), so answers can't be changed to shift the per-School
 * statistics. A Ballot already cast takes the same School.
 */
export async function setOwnSchool(db: Db, personId: string, school: School) {
  return db.$transaction(async (tx) => {
    const state = await tx.electionState.findUnique({
      where: { id: 'main' },
      select: { resultsReleasedAt: true },
    })
    if (state?.resultsReleasedAt) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Results have been released. Your School can no longer be added.',
      })
    }

    // Conditional update, as in registration.submit: matches nothing if a School is already
    // recorded. Its row lock also orders it against ballot.cast (FOR SHARE on this row): a
    // concurrent cast either reads this School or has its Ballot filled below.
    const { count } = await tx.registration.updateMany({
      where: { personId, school: null },
      data: { school },
    })
    if (count === 0) {
      const registered = await tx.registration.findUnique({
        where: { personId },
        select: { id: true },
      })
      throw registered
        ? new TRPCError({ code: 'CONFLICT', message: 'Your School is already recorded.' })
        : new TRPCError({ code: 'NOT_FOUND', message: 'Register before adding your School.' })
    }

    await tx.ballot.updateMany({ where: { personId, school: null }, data: { school } })
    return { school }
  })
}
