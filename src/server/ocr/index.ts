import 'server-only'
import { runOcr } from './engine'
import { extractFields, matchFields } from './fields'
import { withOcrLock } from './lock'

export type StudentProfileFields = {
  name: string
  studentId: string
  yearLevel: string
  term: string
}

export type StudentProfileMatches = {
  name: boolean
  studentId: boolean
  yearLevel: boolean
  term: boolean
}

export type StudentProfileReading = {
  fields: StudentProfileFields
  matches: StudentProfileMatches
}

export async function readStudentProfile(
  image: Buffer,
  expected: StudentProfileFields,
): Promise<StudentProfileReading> {
  const { boxes } = await withOcrLock(() => runOcr(image))
  const fields = extractFields(boxes)
  const matches = matchFields(fields, expected)
  return {
    fields,
    matches: {
      name: matches.name === true,
      studentId: matches.studentId === true,
      yearLevel: matches.yearLevel === true,
      term: matches.term === true,
    },
  }
}
