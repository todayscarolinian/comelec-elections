import { TRPCError } from '@trpc/server'
import { adminProcedure } from '@/server/trpc/init'
import { revokeAdminInputSchema, revokeAdminOutputSchema } from '../../schema'
import {
  AdminNotFoundError,
  AdminRevokeConflictError,
  LastAdminError,
  revokeAdmin as revokeAdminService,
} from '../../services/adminPermissions'

export const revokeAdmin = adminProcedure
  .input(revokeAdminInputSchema)
  .output(revokeAdminOutputSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      await revokeAdminService(ctx.db, { email: input.email, revokedBy: ctx.adminEmail })
    } catch (error) {
      if (error instanceof AdminNotFoundError) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Admin not found' })
      }
      if (error instanceof LastAdminError) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot revoke the last Admin',
        })
      }
      if (error instanceof AdminRevokeConflictError) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'The Admin list changed at the same time. Try again.',
        })
      }
      throw error
    }

    return { ok: true as const }
  })
