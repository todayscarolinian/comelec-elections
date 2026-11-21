import { adminProcedure } from '@/server/trpc/init'
import { listAdminsOutputSchema } from '../../schema'
import { listAdmins as listAdminsService } from '../../services/adminPermissions'

export const listAdmins = adminProcedure
  .output(listAdminsOutputSchema)
  .query(({ ctx }) => listAdminsService(ctx.db))
