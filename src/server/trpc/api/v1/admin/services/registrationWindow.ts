import { TRPCError } from '@trpc/server'
import type { Db } from '@/server/trpc/init'

const windowSelect = { registrationStatus: true, electionStatus: true } as const

function missingStateError() {
  return new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Election state has not been initialized.',
  })
}

export async function getRegistrationStatus(db: Db) {
  const state = await db.electionState.findUnique({
    where: { id: 'main' },
    select: windowSelect,
  })
  if (!state) throw missingStateError()
  return state
}
