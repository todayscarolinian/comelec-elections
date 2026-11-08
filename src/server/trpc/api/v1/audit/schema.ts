export const AUDIT_ACTIONS = [
  'REJECT_REGISTRATION',
  'APPROVE_REGISTRATION',
  'VIEW_BALLOTS',
  'EXPORT_BALLOTS',
  'VIEW_RESULTS',
  'RELEASE_RESULTS',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]
