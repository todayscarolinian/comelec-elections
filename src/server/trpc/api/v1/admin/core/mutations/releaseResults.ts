import { adminProcedure } from '@/server/trpc/init'
import { releaseResultsOutputSchema } from '../../schema'
import { releaseResults as releaseResultsService } from '../../services/electionState'

export const releaseResults = adminProcedure
  .output(releaseResultsOutputSchema)
  .mutation(({ ctx }) => releaseResultsService(ctx.db, { adminEmail: ctx.adminEmail }))
