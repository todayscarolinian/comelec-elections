import { adminProcedure } from '@/server/trpc/init'
import { registrationWindowOutputSchema } from '../../schema'
import { getRegistrationWindow as getRegistrationWindowService } from '../../services/electionState'

export const getRegistrationWindow = adminProcedure
  .output(registrationWindowOutputSchema)
  .query(({ ctx }) => getRegistrationWindowService(ctx.db))
