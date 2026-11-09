import { createTRPCRouter } from '@/server/trpc/init'
import { createStudyLoadUpload } from './core/mutations/createStudyLoadUpload'

export const registrationRouter = createTRPCRouter({
  createStudyLoadUpload,
})
