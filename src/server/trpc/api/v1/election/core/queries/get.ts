// core/queries/get.ts
import { publicProcedure } from '@/server/trpc/init'
import { electionGetOutputSchema } from '../../schema'
import { getElectionStatus } from '../../services/electionState'

export const get = publicProcedure
  .output(electionGetOutputSchema)
  .query(async ({ ctx }) => ({ status: await getElectionStatus(ctx.db) }))
