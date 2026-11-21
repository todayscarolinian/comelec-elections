import { adminProcedure } from '@/server/trpc/init'
import { dashboardOutputSchema } from '../../schema'
import { getDashboard as getDashboardService } from '../../services/dashboard'

export const getDashboard = adminProcedure
  .output(dashboardOutputSchema)
  .query(({ ctx }) => getDashboardService(ctx.db))
