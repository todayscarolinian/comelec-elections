import { protectedProcedure } from '@/server/trpc/init'
import { listInputSchema, listOutputSchema } from '../../schema'
import { listNotifications } from '../../services/listNotifications'

export const list = protectedProcedure
  .input(listInputSchema)
  .output(listOutputSchema)
  .query(({ ctx, input }) => listNotifications(ctx.db, ctx.person, input.limit))
