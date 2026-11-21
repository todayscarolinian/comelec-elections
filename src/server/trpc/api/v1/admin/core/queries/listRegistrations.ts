import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { adminProcedure } from '@/server/trpc/init'
import { listRegistrationsInputSchema, registrationReviewOutputSchema } from '../../schema'
import { listRegistrations as list } from '../../services/registrationReview'

export const listRegistrations = adminProcedure
  .input(listRegistrationsInputSchema)
  .output(z.array(registrationReviewOutputSchema))
  .query(async ({ ctx, input }) => {
    try {
      return await list(ctx.db, input)
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to load registrations.',
      })
    }
  })
