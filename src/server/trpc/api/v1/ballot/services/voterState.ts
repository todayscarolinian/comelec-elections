import type { Db } from '@/server/trpc/init'

/** Reads only what the status needs. BallotAnswer is never touched, so choices can't leak. */
export async function loadVoterState(db: Db, personId: string) {
  const [registration, ballot] = await Promise.all([
    db.registration.findUnique({ where: { personId }, select: { status: true } }),
    db.ballot.findUnique({ where: { personId }, select: { id: true } }),
  ])
  return { registrationStatus: registration?.status ?? null, hasBallot: ballot !== null }
}
