import { SCHOOLS, SCHOOL_LABELS, type School } from '@/server/trpc/api/v1/registration/schema'

export type SchoolCountRow = { school: string | null; ballots: number }

export type SchoolTurnout = {
  /** A code from SCHOOLS, or null for Ballots whose Voter hasn't given a School yet. */
  school: string | null
  label: string
  /** Ballots whose Registration is APPROVED. */
  counted: number
  /** Held Ballots: the Registration is PENDING or REJECTED, so they aren't counted. */
  held: number
}

export const NOT_RECORDED_LABEL = 'Not recorded'

/**
 * Every configured School in list order (zeros included), then any stored code that is no
 * longer in the list, then "Not recorded" when some Ballots have no School yet.
 */
export function turnoutBySchool(
  counted: readonly SchoolCountRow[],
  held: readonly SchoolCountRow[],
): SchoolTurnout[] {
  const key = (school: string | null) => school ?? ''
  const countedBy = new Map(counted.map((row) => [key(row.school), row.ballots]))
  const heldBy = new Map(held.map((row) => [key(row.school), row.ballots]))
  const row = (school: string | null, label: string): SchoolTurnout => ({
    school,
    label,
    counted: countedBy.get(key(school)) ?? 0,
    held: heldBy.get(key(school)) ?? 0,
  })

  const known = new Set<string>(SCHOOLS)
  const unknown = [...new Set([...counted, ...held].map((entry) => entry.school))]
    .filter((school): school is string => school !== null && !known.has(school))
    .sort()
  const rows = [
    ...SCHOOLS.map((school: School) => row(school, SCHOOL_LABELS[school])),
    ...unknown.map((school) => row(school, school)),
  ]
  const notRecorded = row(null, NOT_RECORDED_LABEL)
  return notRecorded.counted || notRecorded.held ? [...rows, notRecorded] : rows
}
