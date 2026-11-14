import { TRPCError } from '@trpc/server'
import { Prisma, type WindowStatus } from '@/generated/prisma/client'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
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

export async function setRegistrationStatus(db: Db, status: WindowStatus, adminEmail: string) {
  return db.$transaction(async (tx) => {
    let state
    try {
      // UPDATE takes a row lock, cooperating with submission's FOR SHARE lock.
      state = await tx.electionState.update({
        where: { id: 'main' },
        data: { registrationStatus: status },
        select: windowSelect,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw missingStateError()
      }
      throw error
    }

    await writeAudit(
      {
        adminEmail,
        action: 'SET_REGISTRATION_STATUS',
        target: 'main',
        detail: { registrationStatus: status },
      },
      tx,
    )
    return state
  })
}
