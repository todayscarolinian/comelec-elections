import { protectedProcedure } from '@/server/trpc/init'
import { markReadOutputSchema } from '../../schema'
import { markAllRead as markAllReadService } from '../../services/markRead'

export const markAllRead = protectedProcedure
  .output(markReadOutputSchema)
  .mutation(({ ctx }) => markAllReadService(ctx.db, ctx.person))
