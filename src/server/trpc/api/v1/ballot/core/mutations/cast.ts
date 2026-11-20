import { TRPCError } from '@trpc/server'
import { castBallotInputSchema } from '@/server/trpc/api/v1/ballot/schema'
import { BallotCastError, castBallot } from '@/server/trpc/api/v1/ballot/services/castBallot'
import { protectedProcedure } from '@/server/trpc/init'

const failureCodes = {
  ElectionClosed: 'FORBIDDEN',
  NotRegistered: 'FORBIDDEN',
  HeldNotAcknowledged: 'FORBIDDEN',
  InvalidBallot: 'BAD_REQUEST',
  AlreadyVoted: 'CONFLICT',
} as const

export const cast = protectedProcedure
  .use(async ({ next }) => {
    // JSON/SuperJSON decoding is lazy and can fail before the resolver runs.
    // Its error message and cause can contain fragments of submitted choices.
    const result = await next()
    if (!result.ok && result.error.code === 'BAD_REQUEST') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'InvalidBallot' })
    }
    return result
  })
  .input(castBallotInputSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      await castBallot(ctx.db, ctx.person.id, input)
    } catch (error) {
      if (error instanceof BallotCastError) {
        throw new TRPCError({ code: failureCodes[error.reason], message: error.reason })
      }
      // Prisma errors can contain query arguments. Do not log or attach the cause:
      // tRPC's development error formatting would expose it to the caller.
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to cast Ballot.' })
    }
    return { ok: true as const }
  })
