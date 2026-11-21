import { adminProcedure } from '@/server/trpc/init'
import { revokeAdminInputSchema, revokeAdminOutputSchema } from '../../schema'
import { revokeAdmin as revokeAdminService } from '../../services/adminPermissions'

export const revokeAdmin = adminProcedure
  .input(revokeAdminInputSchema)
  .output(revokeAdminOutputSchema)
  .mutation(async ({ ctx, input }) => {
    await revokeAdminService(ctx.db, { email: input.email, revokedBy: ctx.adminEmail })
    return { ok: true as const }
  })
