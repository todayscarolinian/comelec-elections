import { protectedProcedure } from '@/server/trpc/init'
import { myStatusOutputSchema } from '../../schema'
import { loadVoterState } from '../../services/voterState'
import { deriveMyStatus } from '../myStatus'

export const myStatus = protectedProcedure.output(myStatusOutputSchema).query(async ({ ctx }) => ({
  status: deriveMyStatus(await loadVoterState(ctx.db, ctx.person.id)),
}))
