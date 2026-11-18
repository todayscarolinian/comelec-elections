import { protectedProcedure } from '@/server/trpc/init'
import { ownRegistrationOutputSchema } from '../../schema'
import { getOwnRegistration } from '../../services/getOwnRegistration'

export const getMine = protectedProcedure
  .output(ownRegistrationOutputSchema)
  .query(({ ctx }) => getOwnRegistration(ctx.db, ctx.person.id))
