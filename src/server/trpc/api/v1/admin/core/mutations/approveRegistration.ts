import { adminProcedure } from '@/server/trpc/init'
import { approveRegistrationInputSchema, reviewDecisionOutputSchema } from '../../schema'
import { reviewRegistration } from '../../services/registrationReview'

export const approveRegistration = adminProcedure
  .input(approveRegistrationInputSchema)
  .output(reviewDecisionOutputSchema)
  .mutation(({ ctx, input }) =>
    reviewRegistration(ctx.db, { ...input, adminEmail: ctx.adminEmail, status: 'APPROVED' }),
  )
