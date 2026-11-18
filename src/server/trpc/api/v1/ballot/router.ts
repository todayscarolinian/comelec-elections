// router.ts
import { createTRPCRouter } from '@/server/trpc/init'
import { myStatus } from './core/queries/myStatus'

export const ballotRouter = createTRPCRouter({ myStatus })
