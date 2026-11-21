import { adminRouter } from './api/v1/admin/router'
import { ballotRouter } from './api/v1/ballot/router'
import { electionRouter } from './api/v1/election/router'
import { healthRouter } from './api/v1/health/router'
import { notificationRouter } from './api/v1/notification/router'
import { registrationRouter } from './api/v1/registration/router'
import { resultsRouter } from './api/v1/results/router'
import { createTRPCRouter } from './init'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ballot: ballotRouter,
  election: electionRouter,
  health: healthRouter,
  notification: notificationRouter,
  registration: registrationRouter,
  results: resultsRouter,
})

export type AppRouter = typeof appRouter
