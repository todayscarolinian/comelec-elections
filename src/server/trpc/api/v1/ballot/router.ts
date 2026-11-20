import { cast } from '@/server/trpc/api/v1/ballot/core/mutations/cast'
import { myStatus } from '@/server/trpc/api/v1/ballot/core/queries/myStatus'
import { createTRPCRouter } from '@/server/trpc/init'

export const ballotRouter = createTRPCRouter({
  cast,
  myStatus,
})
