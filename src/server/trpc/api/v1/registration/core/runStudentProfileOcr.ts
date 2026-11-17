import { CURRENT_TERM } from '@/election'
import { readStudentProfile } from '@/server/ocr'
import type { Db } from '@/server/trpc/init'
import { downloadStudentProfile } from '../services/studentProfileStorage'
import { Prisma } from '@/generated/prisma/client'

export type StudentProfileOcrJob = {
  db: Db
  personId: string
  studentProfilePath: string
  name: string
  email: string
  yearLevel: string
}

export async function runStudentProfileOcr(job: StudentProfileOcrJob): Promise<void> {
  const { db, personId, studentProfilePath } = job
  const where = { personId, studentProfilePath }
  try {
    const image = await downloadStudentProfile(studentProfilePath)
    const { fields, matches } = await readStudentProfile(image, {
      name: job.name,
      studentId: job.email.split('@')[0],
      yearLevel: job.yearLevel,
      term: CURRENT_TERM,
    })
    await db.registration.updateMany({
      where,
      data: { ocrStatus: 'DONE', ocrResult: { fields, matches } },
    })
  } catch (error) {
    console.error('Student Profile OCR failed:', error instanceof Error ? error.name : 'unknown')
    try {
      await db.registration.updateMany({
        where,
        data: { ocrStatus: 'FAILED', ocrResult: Prisma.DbNull },
      })
    } catch {
      // Nothing more can be done; ocrView reports a stuck PENDING as FAILED after 10 minutes.
    }
  }
}
