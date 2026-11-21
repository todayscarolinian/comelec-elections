import type { Db } from '@/server/trpc/init'
import { dashboardPhase } from '../core/dashboardPhase'
import { totalsBySchool } from '../core/schoolBreakdown'
import { countBallotsBySchool } from './schoolBallotCounts'

const electionStatusAudit = (status: 'OPEN' | 'CLOSED') => ({
  action: 'SET_ELECTION_STATUS',
  detail: { path: ['status'], equals: status },
})

export async function getDashboard(db: Db) {
  const [
    state,
    ballotCount,
    pending,
    approved,
    rejected,
    pendingPreview,
    recentActivity,
    firstOpened,
    lastClosed,
    schoolCounts,
  ] = await db.$transaction([
    db.electionState.findUnique({
      where: { id: 'main' },
      select: { electionStatus: true, registrationStatus: true, resultsReleasedAt: true },
    }),
    db.ballot.count(),
    db.registration.count({ where: { status: 'PENDING' } }),
    db.registration.count({ where: { status: 'APPROVED' } }),
    db.registration.count({ where: { status: 'REJECTED' } }),
    db.registration.findMany({
      where: { status: 'PENDING' },
      orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
      take: 3,
      select: { id: true, yearLevel: true, person: { select: { name: true, email: true } } },
    }),
    db.auditLog.findMany({
      orderBy: [{ at: 'desc' }, { id: 'desc' }],
      take: 2,
      select: { id: true, adminEmail: true, action: true, target: true, detail: true, at: true },
    }),
    db.auditLog.findFirst({ where: electionStatusAudit('OPEN'), select: { at: true } }),
    db.auditLog.findFirst({
      where: electionStatusAudit('CLOSED'),
      orderBy: { at: 'desc' },
      select: { at: true },
    }),
    countBallotsBySchool(db),
  ])

  const electionStatus = state?.electionStatus ?? 'CLOSED'
  const resultsReleasedAt = state?.resultsReleasedAt ?? null

  return {
    phase: dashboardPhase({ electionStatus, resultsReleasedAt, hasVotingOpened: !!firstOpened }),
    electionStatus,
    registrationStatus: state?.registrationStatus ?? 'CLOSED',
    resultsReleasedAt,
    votingClosedAt: electionStatus === 'CLOSED' ? (lastClosed?.at ?? null) : null,
    ballotCount,
    registrations: { pending, approved, rejected, total: pending + approved + rejected },
    pendingPreview: pendingPreview.map(({ id, yearLevel, person }) => ({
      id,
      yearLevel,
      name: person.name,
      email: person.email,
    })),
    recentActivity,
    turnoutBySchool: totalsBySchool(schoolCounts),
  }
}
