import { adminProcedure } from '@/server/trpc/init'
import { registrationWindowOutputSchema } from '../../schema'
import { getRegistrationStatus as getRegistrationStatusService } from '../../services/registrationWindow'

export const getRegistrationStatus = adminProcedure
  .output(registrationWindowOutputSchema)
  .query(({ ctx }) => getRegistrationStatusService(ctx.db))
