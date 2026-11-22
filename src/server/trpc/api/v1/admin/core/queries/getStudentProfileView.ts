import { TRPCError } from '@trpc/server'
import { adminProcedure } from '@/server/trpc/init'
import { studentProfileViewInputSchema, studentProfileViewOutputSchema } from '../../schema'
import { getStudentProfileView as getView } from '../../services/registrationReview'

export const getStudentProfileView = adminProcedure
  .input(studentProfileViewInputSchema)
  .output(studentProfileViewOutputSchema)
  .query(async ({ ctx, input }) => {
    try {
      return await getView(ctx.db, input)
    } catch (error) {
      if (error instanceof TRPCError) throw error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to view Student Profile.',
      })
    }
  })
