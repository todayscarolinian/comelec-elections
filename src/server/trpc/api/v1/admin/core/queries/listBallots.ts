import { adminProcedure } from '@/server/trpc/init'
import { listBallotsInputSchema, listBallotsOutputSchema } from '../../schema'
import { listBallots as listBallotsService } from '../../services/ballotAudit'

export const listBallots = adminProcedure
  .input(listBallotsInputSchema)
  .output(listBallotsOutputSchema)
  .query(({ ctx, input }) => listBallotsService(ctx.db, input, ctx.adminEmail))
