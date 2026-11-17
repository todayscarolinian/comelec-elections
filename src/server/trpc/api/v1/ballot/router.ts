import { cast } from '@/server/trpc/api/v1/ballot/core/mutations/cast'
import { createTRPCRouter } from '@/server/trpc/init'

export const ballotRouter = createTRPCRouter({ cast })
