import { adminProcedure } from '@/server/trpc/init'
import { setElectionStatusInputSchema, setElectionStatusOutputSchema } from '../../schema'
import { setElectionStatus as setElectionStatusService } from '../../services/electionState'

export const setElectionStatus = adminProcedure
  .input(setElectionStatusInputSchema)
  .output(setElectionStatusOutputSchema)
  .mutation(({ ctx, input }) =>
    setElectionStatusService(ctx.db, { status: input.status, adminEmail: ctx.adminEmail }),
  )
