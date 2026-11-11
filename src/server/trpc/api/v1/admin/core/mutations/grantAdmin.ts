import { adminProcedure } from '@/server/trpc/init'
import { grantAdminInputSchema, grantAdminOutputSchema } from '../../schema'
import { grantAdmin as grantAdminService } from '../../services/adminPermissions'

export const grantAdmin = adminProcedure
  .input(grantAdminInputSchema)
  .output(grantAdminOutputSchema)
  .mutation(async ({ ctx, input }) => {
    const admin = await grantAdminService(ctx.db, {
      email: input.email,
      grantedBy: ctx.adminEmail,
    })
    return { email: admin.email }
  })
