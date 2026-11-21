import type { DASHBOARD_PHASES } from '../schema'

export type DashboardPhase = (typeof DASHBOARD_PHASES)[number]

type PhaseInput = {
  electionStatus: 'OPEN' | 'CLOSED'
  resultsReleasedAt: Date | null
  hasVotingOpened: boolean
}

// A closed Election is "before voting" until an Admin has opened it at least once.
export function dashboardPhase({
  electionStatus,
  resultsReleasedAt,
  hasVotingOpened,
}: PhaseInput): DashboardPhase {
  if (resultsReleasedAt) return 'RELEASED'
  if (electionStatus === 'OPEN') return 'VOTING_OPEN'
  return hasVotingOpened ? 'VOTING_CLOSED' : 'BEFORE_VOTING'
}
