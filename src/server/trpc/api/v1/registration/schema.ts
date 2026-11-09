import { z } from 'zod'

export const createStudentProfileUploadOutputSchema = z.object({
  path: z.string().min(1),
  signedUrl: z.url(),
})
