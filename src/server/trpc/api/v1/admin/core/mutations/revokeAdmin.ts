import { adminProcedure } from '@/server/trpc/init'
import { revokeAdminInputSchema } from '../../schema'
import { revokeAdmin as revokeAdminService } from '../../services/adminPermissions'

export const revokeAdmin = adminProcedure
  .input(revokeAdminInputSchema)
  .mutation(async ({ ctx, input }) => {
    await revokeAdminService({ email: input.email, revokedBy: ctx.adminEmail })
    return { ok: true as const }
  })
