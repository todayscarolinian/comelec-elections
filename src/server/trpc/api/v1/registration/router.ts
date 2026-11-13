import { createTRPCRouter } from '@/server/trpc/init'
import { createStudentProfileUpload } from './core/mutations/createStudentProfileUpload'
import { submit } from './core/mutations/submit'

export const registrationRouter = createTRPCRouter({
  createStudentProfileUpload,
  submit,
})
