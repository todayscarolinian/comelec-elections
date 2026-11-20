import { adminProcedure } from '@/server/trpc/init'
import { rejectRegistrationInputSchema, reviewDecisionOutputSchema } from '../../schema'
import { reviewRegistration } from '../../services/registrationReview'

export const rejectRegistration = adminProcedure
  .input(rejectRegistrationInputSchema)
  .output(reviewDecisionOutputSchema)
  .mutation(({ ctx, input }) =>
    reviewRegistration(ctx.db, { ...input, adminEmail: ctx.adminEmail, status: 'REJECTED' }),
  )
