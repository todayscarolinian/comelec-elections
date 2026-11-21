import { z } from 'zod'

export const YEAR_LEVELS = ['1', '2', '3', '4'] as const

export type YearLevel = (typeof YEAR_LEVELS)[number]

export const YEAR_LEVEL_LABELS: Record<YearLevel, string> = {
  '1': '1st Year',
  '2': '2nd Year',
  '3': '3rd Year',
  '4': '4th Year',
}

// Placeholder Schools until the client confirms the official list. Codes are stored in the
// database, so keep them stable; change only the labels when a School is renamed.
export const SCHOOLS = ['SCHOOL_A', 'SCHOOL_B', 'SCHOOL_C'] as const

export type School = (typeof SCHOOLS)[number]

export const SCHOOL_LABELS: Record<School, string> = {
  SCHOOL_A: 'School A',
  SCHOOL_B: 'School B',
  SCHOOL_C: 'School C',
}

export const createStudentProfileUploadOutputSchema = z.object({
  path: z.string().min(1),
  signedUrl: z.url(),
})

export const submitRegistrationInputSchema = z.object({
  yearLevel: z.enum(YEAR_LEVELS),
  school: z.enum(SCHOOLS),
  studentProfilePath: z.string().min(1),
})

export const ocrResultSchema = z.object({
  fields: z.object({
    name: z.string(),
    studentId: z.string(),
    yearLevel: z.string(),
    term: z.string(),
  }),
  matches: z.object({
    name: z.boolean(),
    studentId: z.boolean(),
    yearLevel: z.boolean(),
    term: z.boolean(),
  }),
})

export type OcrResult = z.infer<typeof ocrResultSchema>

export const ownRegistrationOutputSchema = z.object({
  account: z.object({
    name: z.string(),
    email: z.string(),
  }),
  registration: z
    .object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
      yearLevel: z.string(),
      school: z.string().nullable(),
      rejectionReason: z.string().nullable(),
    })
    .nullable(),
  canSubmit: z.boolean(),
})

export const setSchoolInputSchema = z.object({ school: z.enum(SCHOOLS) })
export const setSchoolOutputSchema = z.object({ school: z.enum(SCHOOLS) })
