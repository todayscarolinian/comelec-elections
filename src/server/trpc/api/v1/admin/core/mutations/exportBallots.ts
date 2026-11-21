import { adminProcedure } from '@/server/trpc/init'
import { exportBallotsOutputSchema } from '../../schema'
import { exportBallots as exportBallotsService } from '../../services/ballotAudit'

// A mutation, not a query, so React Query never refetches it: every export writes an AuditLog row.
export const exportBallots = adminProcedure
  .output(exportBallotsOutputSchema)
  .mutation(({ ctx }) => exportBallotsService(ctx.db, ctx.adminEmail))
