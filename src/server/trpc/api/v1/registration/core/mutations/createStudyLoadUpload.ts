import { TRPCError } from '@trpc/server'
import { protectedProcedure } from '@/server/trpc/init'
import { createStudyLoadUploadOutputSchema } from '../../schema'
import { isRegistrationOpen } from '../../services/registrationWindow'
import { createSignedStudyLoadUpload } from '../../services/studyLoadStorage'

export const createStudyLoadUpload = protectedProcedure
  .output(createStudyLoadUploadOutputSchema)
  .mutation(async ({ ctx }) => {
    if (!(await isRegistrationOpen(ctx.db))) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'The Registration Period is closed.',
      })
    }

    try {
      return await createSignedStudyLoadUpload(ctx.person.id)
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to prepare the Study Load upload.',
      })
    }
  })
