import { createTRPCRouter } from '@/server/trpc/init'
import { ping } from './core/queries/ping'

export const healthRouter = createTRPCRouter({
  ping,
})
