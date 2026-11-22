import { protectedProcedure } from '@/server/trpc/init'
import { markReadInputSchema, markReadOutputSchema } from '../../schema'
import { markRead as markReadService } from '../../services/markRead'

export const markRead = protectedProcedure
  .input(markReadInputSchema)
  .output(markReadOutputSchema)
  .mutation(({ ctx, input }) => markReadService(ctx.db, ctx.person, input.ids))
