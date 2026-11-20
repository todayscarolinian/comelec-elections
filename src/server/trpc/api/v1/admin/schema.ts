import { z } from 'zod'
import { normalizeHostedDomain } from '@/server/auth/policy'
import { YEAR_LEVELS, ocrResultSchema } from '@/server/trpc/api/v1/registration/schema'

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
  status: registrationStatusSchema,
  submittedAt: z.date(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.date().nullable(),
  rejectionReason: z.string().nullable(),
  hasHeldBallot: z.boolean(),
  studentProfileUrl: z.url().nullable(),
  ocrStatus: z.enum(['PENDING', 'DONE', 'FAILED']),
  ocrResult: ocrResultSchema.nullable(),
})

export const approveRegistrationInputSchema = z.object({
  id: z.uuid(),
  submittedAt: z.date().optional(),
  yearLevel: z.enum(YEAR_LEVELS).optional(),
})
export const rejectRegistrationInputSchema = z.object({
  id: z.uuid(),
  submittedAt: z.date().optional(),
  reason: z.string().trim().min(1).max(2000),
})
export const reviewDecisionOutputSchema = z.object({ ok: z.literal(true) })
