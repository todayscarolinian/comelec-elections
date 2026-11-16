import type { Db } from '@/server/trpc/init'

/** A missing ElectionState row means nothing has been opened yet, so CLOSED. */
export async function getElectionStatus(db: Db) {
  const state = await db.electionState.findUnique({
    where: { id: 'main' },
    select: { electionStatus: true },
  })
  return state?.electionStatus ?? 'CLOSED'
}
