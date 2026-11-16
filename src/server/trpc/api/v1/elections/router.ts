// router.ts
import { createTRPCRouter } from '@/server/trpc/init'
import { get } from './core/queries/get'

export const electionRouter = createTRPCRouter({ get })
