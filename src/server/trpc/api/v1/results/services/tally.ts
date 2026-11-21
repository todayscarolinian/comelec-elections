import { TRPCError } from '@trpc/server'
import { ELECTION } from '@/election'
import { normalizeEmail } from '@/server/auth/policy'
import type { Db, Session } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'
import { buildResults } from '../core/buildResults'

const counted = { person: { registration: { is: { status: 'APPROVED' as const } } } }

export async function getResults(db: Db, session: Session, audience: 'public' | 'admin') {
  const state = await db.electionState.findUnique({
    where: { id: 'main' },
    select: { resultsReleasedAt: true },
  })
  const releasedAt = state?.resultsReleasedAt ?? null

  // Before release, only Admins (checked in the database) may see Results, and only on the
  // Admin panel. Each pre-release view is audited.
  let viewingAdmin: string | null = null
  if (!releasedAt) {
    if (audience === 'public') throw new TRPCError({ code: 'FORBIDDEN' })
    const admin = session
      ? await db.admin.findUnique({ where: { email: normalizeEmail(session.user.email) } })
      : null
    if (!admin) throw new TRPCError({ code: 'FORBIDDEN' })
    viewingAdmin = admin.email
  }

  const [tally, countedBallots, heldPending, heldRejected] = await db.$transaction([
    db.ballotAnswer.groupBy({
      by: ['questionId', 'candidateId'],
      where: { ballot: counted },
      orderBy: [{ questionId: 'asc' }, { candidateId: 'asc' }],
      _count: { _all: true },
    }),
    db.ballot.count({ where: counted }),
    db.ballot.count({ where: { person: { registration: { is: { status: 'PENDING' } } } } }),
    db.ballot.count({ where: { person: { registration: { is: { status: 'REJECTED' } } } } }),
  ])

  if (viewingAdmin) {
    await writeAudit({ adminEmail: viewingAdmin, action: 'VIEW_RESULTS', target: 'main' }, db)
  }

  return buildResults({
    election: ELECTION,
    tally: tally.map((row) => ({
      questionId: row.questionId,
      candidateId: row.candidateId,
      votes: typeof row._count === 'object' ? (row._count._all ?? 0) : 0,
    })),
    countedBallots,
    heldPending,
    heldRejected,
    releasedAt,
  })
}
