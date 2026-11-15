import { adminProcedure } from '@/server/trpc/init'
import { setRegistrationStatusInputSchema, setRegistrationStatusOutputSchema } from '../../schema'
import { setRegistrationStatus as setRegistrationStatusService } from '../../services/electionState'

export const setRegistrationStatus = adminProcedure
  .input(setRegistrationStatusInputSchema)
  .output(setRegistrationStatusOutputSchema)
  .mutation(({ ctx, input }) => setRegistrationStatusService(ctx.db, input.status))
