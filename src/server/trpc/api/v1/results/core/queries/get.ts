import { publicProcedure } from '@/server/trpc/init'
import { getResultsInputSchema, resultsOutputSchema } from '../../schema'
import { getResults } from '../../services/tally'

export const get = publicProcedure
  .input(getResultsInputSchema)
  .output(resultsOutputSchema)
  .query(({ ctx, input }) => getResults(ctx.db, ctx.session, input.audience))
