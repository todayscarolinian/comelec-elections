import { TRPCError } from '@trpc/server'
import type { Db } from '@/server/trpc/init'
import type { School } from '../schema'

type RegistrationRow = { school: string | null }

/**
 * One-time School answer for Registrations made before School was collected.
 * Once set, only an Admin can change it (on approval), so answers can't be changed to shift
 * the per-School statistics. A Ballot already cast takes the same School.
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

    // Lock the row so a concurrent cast either reads this School or is updated by it below.
    const [registration] = await tx.$queryRaw<RegistrationRow[]>`
      SELECT school
      FROM "Registration"
      WHERE "personId" = ${personId}
      FOR UPDATE
    `
    if (!registration) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Register before adding your School.' })
    }
    if (registration.school !== null) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Your School is already recorded.' })
    }

    await tx.registration.update({ where: { personId }, data: { school }, select: { id: true } })
    await tx.ballot.updateMany({ where: { personId, school: null }, data: { school } })

    return { school }
  })
}
