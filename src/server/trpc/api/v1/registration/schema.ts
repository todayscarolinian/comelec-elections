import { z } from 'zod'

export const YEAR_LEVELS = ['1', '2', '3', '4'] as const

export type YearLevel = (typeof YEAR_LEVELS)[number]

export const YEAR_LEVEL_LABELS: Record<YearLevel, string> = {
  '1': '1st Year',
  '2': '2nd Year',
  '3': '3rd Year',
  '4': '4th Year',
}

export const createStudentProfileUploadOutputSchema = z.object({
  path: z.string().min(1),
  signedUrl: z.url(),
})

export const submitRegistrationInputSchema = z.object({
  yearLevel: z.enum(YEAR_LEVELS),
  studentProfilePath: z.string().min(1),
})
