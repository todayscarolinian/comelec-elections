import { healthRouter } from './api/v1/health/router'
import { registrationRouter } from './api/v1/registration/router'
import { createTRPCRouter } from './init'

export const appRouter = createTRPCRouter({
  health: healthRouter,
  registration: registrationRouter,
})

export type AppRouter = typeof appRouter
