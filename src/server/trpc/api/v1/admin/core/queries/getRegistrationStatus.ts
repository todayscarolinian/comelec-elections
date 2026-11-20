import { adminProcedure } from '@/server/trpc/init'
import { getRegistrationStatusOutputSchema } from '../../schema'
import { getRegistrationStatus as getRegistrationStatusService } from '../../services/registrationWindow'

export const getRegistrationStatus = adminProcedure
  .output(getRegistrationStatusOutputSchema)
  .query(({ ctx }) => getRegistrationStatusService(ctx.db))
