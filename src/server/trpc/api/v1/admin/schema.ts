import { z } from 'zod'
import { normalizeEmail, normalizeHostedDomain } from '@/server/auth/policy'

const organizationEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email())
  .refine(
    (email) => {
      const domain = normalizeHostedDomain(process.env.ALLOWED_HOSTED_DOMAIN)
      return !!domain && normalizeEmail(email).endsWith(`@${domain}`)
    },
    { message: 'Email must belong to the organization domain' },
  )

export const grantAdminInputSchema = z.object({ email: organizationEmail })
export const revokeAdminInputSchema = z.object({ email: organizationEmail })
