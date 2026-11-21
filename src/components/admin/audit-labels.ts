import type { AuditAction } from '@/server/trpc/api/v1/audit/schema'

const FIXED_LABELS: Partial<Record<AuditAction, string>> = {
  APPROVE_REGISTRATION: 'Approved registration',
  REJECT_REGISTRATION: 'Rejected registration',
  VIEW_BALLOTS: 'Viewed ballot audit',
  EXPORT_BALLOTS: 'Exported ballots',
  VIEW_RESULTS: 'Viewed results',
  RELEASE_RESULTS: 'Released results',
  GRANT_ADMIN: 'Granted admin access',
  REVOKE_ADMIN: 'Revoked admin access',
}

export const AUDIT_ACTION_FILTERS: readonly { value: AuditAction; label: string }[] = [
  { value: 'SET_ELECTION_STATUS', label: 'Election opened or closed' },
  { value: 'SET_REGISTRATION_STATUS', label: 'Registration opened or closed' },
  { value: 'APPROVE_REGISTRATION', label: 'Approved registration' },
  { value: 'REJECT_REGISTRATION', label: 'Rejected registration' },
  { value: 'VIEW_BALLOTS', label: 'Viewed ballot audit' },
  { value: 'EXPORT_BALLOTS', label: 'Exported ballots' },
  { value: 'VIEW_RESULTS', label: 'Viewed results' },
  { value: 'RELEASE_RESULTS', label: 'Released results' },
  { value: 'GRANT_ADMIN', label: 'Granted admin access' },
  { value: 'REVOKE_ADMIN', label: 'Revoked admin access' },
]

function detailStatus(detail: unknown) {
  if (detail && typeof detail === 'object' && 'status' in detail) return detail.status
  return undefined
}

/** Human-readable AuditLog action, e.g. "Opened election". */
export function auditLabel(action: string, detail: unknown) {
  if (action === 'SET_ELECTION_STATUS' || action === 'SET_REGISTRATION_STATUS') {
    const verb = detailStatus(detail) === 'OPEN' ? 'Opened' : 'Closed'
    return `${verb} ${action === 'SET_ELECTION_STATUS' ? 'election' : 'registration'}`
  }
  return FIXED_LABELS[action as AuditAction] ?? action
}
