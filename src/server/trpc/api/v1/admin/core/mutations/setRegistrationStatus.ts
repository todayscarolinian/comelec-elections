import { adminProcedure } from '@/server/trpc/init'
import { registrationWindowOutputSchema, setRegistrationStatusInputSchema } from '../../schema'
import { setRegistrationStatus as setRegistrationStatusService } from '../../services/registrationWindow'

export const setRegistrationStatus = adminProcedure
  .input(setRegistrationStatusInputSchema)
  .output(registrationWindowOutputSchema)
  .mutation(({ ctx, input }) => setRegistrationStatusService(ctx.db, input.status, ctx.adminEmail))
