import { createTRPCRouter } from '@/server/trpc/init'
import { approveRegistration } from './core/mutations/approveRegistration'
import { exportBallots } from './core/mutations/exportBallots'
import { grantAdmin } from './core/mutations/grantAdmin'
import { rejectRegistration } from './core/mutations/rejectRegistration'
import { releaseResults } from './core/mutations/releaseResults'
import { revokeAdmin } from './core/mutations/revokeAdmin'
import { setElectionStatus } from './core/mutations/setElectionStatus'
import { setRegistrationStatus } from './core/mutations/setRegistrationStatus'
import { getDashboard } from './core/queries/getDashboard'
import { getRegistrationWindow } from './core/queries/getRegistrationWindow'
import { getStudentProfileView } from './core/queries/getStudentProfileView'
import { getResultsBySchool } from './core/queries/getResultsBySchool'
import { listAdmins } from './core/queries/listAdmins'
import { listAuditLog } from './core/queries/listAuditLog'
import { listBallots } from './core/queries/listBallots'
import { listRegistrations } from './core/queries/listRegistrations'

export const adminRouter = createTRPCRouter({
  listRegistrations,
  getStudentProfileView,
  approveRegistration,
  rejectRegistration,
  grantAdmin,
  revokeAdmin,
  listAdmins,
  setRegistrationStatus,
  setElectionStatus,
  getRegistrationWindow,
  getDashboard,
  releaseResults,
  getResultsBySchool,
  listBallots,
  exportBallots,
  listAuditLog,
})
