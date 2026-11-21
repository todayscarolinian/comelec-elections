import { protectedProcedure } from '@/server/trpc/init'
import { setSchoolInputSchema, setSchoolOutputSchema } from '../../schema'
import { setOwnSchool } from '../../services/setOwnSchool'

export const setSchool = protectedProcedure
  .input(setSchoolInputSchema)
  .output(setSchoolOutputSchema)
  .mutation(({ ctx, input }) => setOwnSchool(ctx.db, ctx.person.id, input.school))
