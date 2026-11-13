import type { Db } from '@/server/trpc/init'
import type { Prisma } from '@/generated/prisma/client'

type WindowRow = {
  registrationStatus: 'OPEN' | 'CLOSED'
  electionStatus: 'OPEN' | 'CLOSED'
}

export async function lockSubmissionWindow(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<WindowRow[]>`
  SELECT "registrationStatus", "electionStatus"
  FROM "ElectionState"
  WHERE id = 'main'
  FOR SHARE
  `
  const state = rows[0]
  return state?.registrationStatus === 'OPEN' || state?.electionStatus === 'OPEN'
}

export async function isRegistrationOpen(db: Db) {
  const state = await db.electionState.findUnique({
    where: { id: 'main' },
    select: { registrationStatus: true },
  })

  return state?.registrationStatus === 'OPEN'
}
