import { createTRPCRouter } from '@/server/trpc/init'
import { createStudentProfileUpload } from './core/mutations/createStudentProfileUpload'
import { submit } from './core/mutations/submit'
import { getMine } from './core/queries/getMine'

export const registrationRouter = createTRPCRouter({
  createStudentProfileUpload,
  submit,
  getMine,
})
