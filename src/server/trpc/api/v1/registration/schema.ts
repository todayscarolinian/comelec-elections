import { z } from 'zod'

export const createStudyLoadUploadOutputSchema = z.object({
  path: z.string().min(1),
  signedUrl: z.url(),
})
