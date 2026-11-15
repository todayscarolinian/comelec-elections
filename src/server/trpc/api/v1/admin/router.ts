import { createTRPCRouter } from '@/server/trpc/init'
import { grantAdmin } from './core/mutations/grantAdmin'
import { revokeAdmin } from './core/mutations/revokeAdmin'
import { setRegistrationStatus } from './core/mutations/setRegistrationStatus'
import { getRegistrationWindow } from './core/queries/getRegistrationWindow'
import { listAdmins } from './core/queries/listAdmins'

export const adminRouter = createTRPCRouter({
  grantAdmin,
  revokeAdmin,
  listAdmins,
  setRegistrationStatus,
  getRegistrationWindow,
})
