import { TRPCError } from '@trpc/server'
import type { Db } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'

type WindowStatus = 'OPEN' | 'CLOSED'

type ElectionWindowRow = {
  electionStatus: WindowStatus
  resultsReleasedAt: Date | null
}

type SetElectionStatusInput = {
  status: WindowStatus
  adminEmail: string
}

export async function setElectionStatus(db: Db, { status, adminEmail }: SetElectionStatusInput) {
  return db.$transaction(async (tx) => {
    // No migration seeds main yet. Skip duplicates without updating an existing row.
    await tx.electionState.createMany({ data: { id: 'main' }, skipDuplicates: true })

    // Share this lock with Results release; it also waits for Ballot casts using FOR SHARE.
    const [state] = await tx.$queryRaw<ElectionWindowRow[]>`
      SELECT "electionStatus", "resultsReleasedAt"
      FROM "ElectionState"
      WHERE id = 'main'
      FOR UPDATE
    `

    if (!state) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to load the Election state.',
      })
    }

    if (status === 'OPEN' && state.resultsReleasedAt !== null) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Election cannot be reopened after Results are released.',
      })
    }

    if (state.electionStatus === status) return { electionStatus: status }

    const updated = await tx.electionState.update({
      where: { id: 'main' },
      data: { electionStatus: status },
      select: { electionStatus: true },
    })

    await writeAudit(
      {
        adminEmail,
        action: 'SET_ELECTION_STATUS',
        target: 'main',
        detail: { previousStatus: state.electionStatus, status },
      },
      tx,
    )

    return updated
  })
}

export async function setRegistrationStatus(db: Db, status: WindowStatus) {
  return db.electionState.upsert({
    where: { id: 'main' },
    update: { registrationStatus: status },
    create: { id: 'main', registrationStatus: status },
    select: { registrationStatus: true },
  })
}

export async function getRegistrationWindow(db: Db) {
  const [state, pendingCount] = await db.$transaction([
    db.electionState.findUnique({
      where: { id: 'main' },
      select: { registrationStatus: true },
    }),
    db.registration.count({ where: { status: 'PENDING' } }),
  ])

  return { registrationStatus: state?.registrationStatus ?? 'CLOSED', pendingCount }
}
