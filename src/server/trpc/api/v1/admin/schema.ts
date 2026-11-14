import { z } from 'zod'
import { normalizeHostedDomain } from '@/server/auth/policy'

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

const windowStatusSchema = z.enum(['OPEN', 'CLOSED'])
export const setRegistrationStatusInputSchema = z.object({ status: windowStatusSchema })
export const registrationWindowOutputSchema = z.object({
  registrationStatus: windowStatusSchema,
  electionStatus: windowStatusSchema,
})

export const listAdminsOutputSchema = z.array(
  z.object({
    email: z.string(),
    grantedBy: z.string(),
    grantedAt: z.date(),
  }),
)
