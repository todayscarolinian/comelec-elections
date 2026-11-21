import { TRPCError } from '@trpc/server'
import type { Db } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
import { notifyEveryone } from '@/server/trpc/api/v1/notification/services/createNotification'

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
    await notifyEveryone(tx, status === 'OPEN' ? 'VOTING_OPENED' : 'VOTING_CLOSED')

    return updated
  })
}

export async function releaseResults(db: Db, { adminEmail }: { adminEmail: string }) {
  return db.$transaction(async (tx) => {
    await tx.electionState.createMany({ data: { id: 'main' }, skipDuplicates: true })

    // Same lock as setElectionStatus, so the Election cannot reopen mid-release.
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
    if (state.resultsReleasedAt !== null) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Results are already released.' })
    }
    if (state.electionStatus !== 'CLOSED') {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Close the Election before releasing Results.',
      })
    }

    const heldPending = await tx.ballot.count({
      where: { person: { registration: { is: { status: 'PENDING' } } } },
    })
    if (heldPending > 0) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Review every Held Ballot registration before releasing Results.',
      })
    }

    const updated = await tx.electionState.update({
      where: { id: 'main' },
      data: { resultsReleasedAt: new Date() },
      select: { resultsReleasedAt: true },
    })

    await writeAudit({ adminEmail, action: 'RELEASE_RESULTS', target: 'main' }, tx)
    await notifyEveryone(tx, 'RESULTS_RELEASED')

    return { resultsReleasedAt: updated.resultsReleasedAt ?? new Date() }
  })
}

type SetRegistrationStatusInput = {
  status: WindowStatus
  adminEmail: string
}

export async function setRegistrationStatus(
  db: Db,
  { status, adminEmail }: SetRegistrationStatusInput,
) {
  return db.$transaction(async (tx) => {
    // Skip duplicates so an existing row keeps its values.
    await tx.electionState.createMany({ data: { id: 'main' }, skipDuplicates: true })

    // Update only when the status changes, so concurrent toggles audit once.
    const { count } = await tx.electionState.updateMany({
      where: { id: 'main', registrationStatus: { not: status } },
      data: { registrationStatus: status },
    })

    if (count === 1) {
      await writeAudit(
        {
          adminEmail,
          action: 'SET_REGISTRATION_STATUS',
          target: 'main',
          detail: { previousStatus: status === 'OPEN' ? 'CLOSED' : 'OPEN', status },
        },
        tx,
      )
      await notifyEveryone(tx, status === 'OPEN' ? 'REGISTRATION_OPENED' : 'REGISTRATION_CLOSED')
    }

    return { registrationStatus: status }
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
