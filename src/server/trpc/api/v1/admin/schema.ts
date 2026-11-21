import { z } from 'zod'
import { normalizeHostedDomain } from '@/server/auth/policy'
import { AUDIT_ACTIONS } from '@/server/trpc/api/v1/audit/schema'
import { SCHOOLS } from '@/server/trpc/api/v1/registration/core/school'
import { YEAR_LEVELS, ocrResultSchema } from '@/server/trpc/api/v1/registration/schema'
import { resultsOutputSchema } from '@/server/trpc/api/v1/results/schema'

const organizationEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email())
  .refine(
    (email) => {
      const domain = normalizeHostedDomain(process.env.ALLOWED_HOSTED_DOMAIN)
      return !!domain && email.endsWith(`@${domain}`)
    },
    { message: 'Email must belong to the organization domain' },
  )

export const grantAdminInputSchema = z.object({ email: organizationEmail })
export const grantAdminOutputSchema = z.object({ email: z.string() })

export const revokeAdminInputSchema = z.object({ email: organizationEmail })
export const revokeAdminOutputSchema = z.object({ ok: z.literal(true) })

export const listAdminsOutputSchema = z.array(
  z.object({
    email: z.string(),
    grantedBy: z.string(),
    grantedAt: z.date(),
  }),
)

export const WINDOW_STATUSES = ['OPEN', 'CLOSED'] as const

const windowStatus = z.enum(WINDOW_STATUSES)

export const setRegistrationStatusInputSchema = z.object({ status: windowStatus })
export const setRegistrationStatusOutputSchema = z.object({ registrationStatus: windowStatus })

export const setElectionStatusInputSchema = z.object({ status: windowStatus })
export const setElectionStatusOutputSchema = z.object({ electionStatus: windowStatus })

export const registrationWindowOutputSchema = z.object({
  registrationStatus: windowStatus,
  pendingCount: z.number().int().nonnegative(),
})

const registrationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])
export const listRegistrationsInputSchema = z
  .object({
    status: registrationStatusSchema.optional(),
    yearLevel: z.enum(YEAR_LEVELS).optional(),
  })
  .default({})

export const registrationReviewOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  studentId: z.string(),
  yearLevel: z.string(),
  school: z.string(),
  status: registrationStatusSchema,
  submittedAt: z.date(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.date().nullable(),
  rejectionReason: z.string().nullable(),
  hasHeldBallot: z.boolean(),
  ocrStatus: z.enum(['PENDING', 'DONE', 'FAILED']),
  ocrResult: ocrResultSchema.nullable(),
})

export const studentProfileViewInputSchema = z.object({
  id: z.uuid(),
  submittedAt: z.date(),
})
export const studentProfileViewOutputSchema = z.object({ url: z.url() })

export const approveRegistrationInputSchema = z.object({
  id: z.uuid(),
  submittedAt: z.date(),
  yearLevel: z.enum(YEAR_LEVELS).optional(),
  school: z.enum(SCHOOLS).optional(),
})
export const rejectRegistrationInputSchema = z.object({
  id: z.uuid(),
  submittedAt: z.date(),
  reason: z.string().trim().min(1).max(2000),
})
export const reviewDecisionOutputSchema = z.object({ ok: z.literal(true) })

const count = z.number().int().nonnegative()

/** Ballot totals for one School. */
export const schoolTotalsSchema = z.object({
  school: z.string(),
  label: z.string(),
  counted: count,
  heldPending: count,
  heldRejected: count,
})

export type SchoolTotals = z.infer<typeof schoolTotalsSchema>

export const DASHBOARD_PHASES = [
  'BEFORE_VOTING',
  'VOTING_OPEN',
  'VOTING_CLOSED',
  'RELEASED',
] as const

export const auditEntryOutputSchema = z.object({
  id: z.string(),
  adminEmail: z.string(),
  action: z.string(),
  target: z.string().nullable(),
  detail: z.unknown(),
  at: z.date(),
})

export const dashboardOutputSchema = z.object({
  phase: z.enum(DASHBOARD_PHASES),
  electionStatus: windowStatus,
  registrationStatus: windowStatus,
  resultsReleasedAt: z.date().nullable(),
  votingClosedAt: z.date().nullable(),
  ballotCount: z.number().int().nonnegative(),
  registrations: z.object({
    pending: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  pendingPreview: z.array(
    z.object({ id: z.string(), name: z.string(), email: z.string(), yearLevel: z.string() }),
  ),
  recentActivity: z.array(auditEntryOutputSchema),
  turnoutBySchool: z.array(schoolTotalsSchema),
})

export const releaseResultsOutputSchema = z.object({ resultsReleasedAt: z.date() })

export const BALLOT_AUDIT_STATUSES = ['COUNTED', 'HELD_PENDING', 'HELD_REJECTED'] as const
const ballotAuditStatus = z.enum(BALLOT_AUDIT_STATUSES)

export const listBallotsInputSchema = z.object({
  yearLevel: z.enum(YEAR_LEVELS).optional(),
  status: ballotAuditStatus.optional(),
  search: z.string().trim().max(200).optional(),
  cursor: z.uuid().optional(),
})

export const ballotAuditRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  yearLevel: z.string(),
  castAt: z.date(),
  status: ballotAuditStatus,
  choices: z.array(
    z.object({
      questionId: z.string(),
      questionTitle: z.string(),
      abstained: z.boolean(),
      candidates: z.array(z.string()),
    }),
  ),
})

export const listBallotsOutputSchema = z.object({
  items: z.array(ballotAuditRowSchema),
  nextCursor: z.string().nullable(),
})

export const exportBallotsOutputSchema = z.object({ filename: z.string(), csv: z.string() })

export const listAuditLogInputSchema = z.object({
  action: z.enum(AUDIT_ACTIONS).optional(),
  cursor: z.uuid().optional(),
})

export const listAuditLogOutputSchema = z.object({
  items: z.array(auditEntryOutputSchema),
  nextCursor: z.string().nullable(),
})

export const resultsBySchoolOutputSchema = z.array(
  z.object({
    school: z.string(),
    label: z.string(),
    results: resultsOutputSchema,
  }),
)
