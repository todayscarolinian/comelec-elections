import { createTRPCRouter } from '@/server/trpc/init'
import { grantAdmin } from './core/mutations/grantAdmin'
import { revokeAdmin } from './core/mutations/revokeAdmin'
import { listAdmins } from './core/queries/listAdmins'
import { getRegistrationStatus } from './core/queries/getRegistrationStatus'
import { setRegistrationStatus } from './core/mutations/setRegistrationStatus'

export const adminRouter = createTRPCRouter({
  grantAdmin,
  revokeAdmin,
  listAdmins,
  getRegistrationStatus,
  setRegistrationStatus,
})
