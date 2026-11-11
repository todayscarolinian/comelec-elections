import { adminProcedure } from '@/server/trpc/init'
import { listAdmins as listAdminsService } from '../../services/adminPermissions'

export const listAdmins = adminProcedure.query(() => listAdminsService())
