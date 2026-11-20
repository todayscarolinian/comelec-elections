import { protectedProcedure } from '@/server/trpc/init'
import { ownRegistrationOutputSchema } from '../../schema'
import { getOwnRegistration } from '../../services/getOwnRegistration'

export const getMine = protectedProcedure
  .output(ownRegistrationOutputSchema)
  .query(async ({ ctx }) => ({
    ...(await getOwnRegistration(ctx.db, ctx.person.id)),
    account: { name: ctx.person.name, email: ctx.person.email },
  }))
