import { createTRPCRouter } from '@/server/trpc/init'
import { listRegistrations } from './core/queries/listRegistrations'
import { approveRegistration } from './core/mutations/approveRegistration'
import { rejectRegistration } from './core/mutations/rejectRegistration'
import { grantAdmin } from './core/mutations/grantAdmin'
import { revokeAdmin } from './core/mutations/revokeAdmin'
import { setElectionStatus } from './core/mutations/setElectionStatus'
import { setRegistrationStatus } from './core/mutations/setRegistrationStatus'
import { getRegistrationWindow } from './core/queries/getRegistrationWindow'
import { listAdmins } from './core/queries/listAdmins'

export const adminRouter = createTRPCRouter({
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  grantAdmin,
  revokeAdmin,
  listAdmins,
  setRegistrationStatus,
  setElectionStatus,
  getRegistrationWindow,
})
