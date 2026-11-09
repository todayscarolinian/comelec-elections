import type { Db } from '@/server/trpc/init'

export async function isRegistrationOpen(db: Db) {
  const state = await db.electionState.findUnique({
    where: { id: 'main' },
    select: { registrationStatus: true },
  })

  return state?.registrationStatus === 'OPEN'
}
