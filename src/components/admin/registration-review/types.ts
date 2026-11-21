import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/trpc/root'

export type Registration = inferRouterOutputs<AppRouter>['admin']['listRegistrations'][number]
export type RegistrationStatus = Registration['status']

export const statusLabels: Record<RegistrationStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}
