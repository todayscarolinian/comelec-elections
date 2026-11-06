import { healthRouter } from './api/v1/health/router'
import { createTRPCRouter } from './init'

export const appRouter = createTRPCRouter({
  health: healthRouter,
})

export type AppRouter = typeof appRouter
