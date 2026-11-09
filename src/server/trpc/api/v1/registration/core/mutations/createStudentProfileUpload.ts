import { TRPCError } from '@trpc/server'
import { protectedProcedure } from '@/server/trpc/init'
import { createStudentProfileUploadOutputSchema } from '../../schema'
import { isRegistrationOpen } from '../../services/registrationWindow'
import { createSignedStudentProfileUpload } from '../../services/studentProfileStorage'

export const createStudentProfileUpload = protectedProcedure
  .output(createStudentProfileUploadOutputSchema)
  .mutation(async ({ ctx }) => {
    if (!(await isRegistrationOpen(ctx.db))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'The Registration Period is closed.',
      })
    }

    try {
      return await createSignedStudentProfileUpload(ctx.person.id)
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to prepare the Student Profile upload.',
      })
    }
  })
