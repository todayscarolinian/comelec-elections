import { adminRouter } from './api/v1/admin/router'
import { ballotRouter } from './api/v1/ballot/router'
import { electionRouter } from './api/v1/elections/router'
import { healthRouter } from './api/v1/health/router'
import { registrationRouter } from './api/v1/registration/router'
import { createTRPCRouter } from './init'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ballot: ballotRouter,
  election: electionRouter,
  health: healthRouter,
  registration: registrationRouter,
})

export type AppRouter = typeof appRouter
