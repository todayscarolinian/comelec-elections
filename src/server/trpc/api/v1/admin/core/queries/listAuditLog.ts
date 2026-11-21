import { adminProcedure } from '@/server/trpc/init'
import { listAuditLogInputSchema, listAuditLogOutputSchema } from '../../schema'
import { listAuditLog as listAuditLogService } from '../../services/auditLog'

export const listAuditLog = adminProcedure
  .input(listAuditLogInputSchema)
  .output(listAuditLogOutputSchema)
  .query(({ ctx, input }) => listAuditLogService(ctx.db, input))
