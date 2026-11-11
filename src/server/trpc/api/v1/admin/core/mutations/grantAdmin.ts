import { adminProcedure } from '@/server/trpc/init'
import { grantAdminInputSchema } from '../../schema'
import { grantAdmin as grantAdminService } from '../../services/adminPermissions'

export const grantAdmin = adminProcedure
  .input(grantAdminInputSchema)
  .mutation(async ({ ctx, input }) => {
    const admin = await grantAdminService({ email: input.email, grantedBy: ctx.adminEmail })
    return { email: admin.email }
  })
