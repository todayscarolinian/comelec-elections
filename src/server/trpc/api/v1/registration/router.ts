import { createTRPCRouter } from '@/server/trpc/init'
import { createStudentProfileUpload } from './core/mutations/createStudentProfileUpload'

export const registrationRouter = createTRPCRouter({
  createStudentProfileUpload,
})
