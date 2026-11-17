import { adminRouter } from './api/v1/admin/router'
import { ballotRouter } from '@/server/trpc/api/v1/ballot/router'
import { healthRouter } from './api/v1/health/router'
import { registrationRouter } from './api/v1/registration/router'
import { createTRPCRouter } from './init'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ballot: ballotRouter,
  health: healthRouter,
  registration: registrationRouter,
})

export type AppRouter = typeof appRouter
