// Alphabetical; this is also the order Schools appear in pickers and statistics. Codes are
// stored in the database, so keep them stable; change only the labels when a School is renamed.
export const SCHOOLS = ['SAFAD', 'SAS', 'SBE', 'SED', 'SHCP', 'SLG', 'SOE'] as const

export type School = (typeof SCHOOLS)[number]

export const SCHOOL_LABELS: Readonly<Record<School, string>> = {
  SAFAD: 'SAFAD',
  SAS: 'SAS',
  SBE: 'SBE',
  SED: 'SED',
  SHCP: 'SHCP',
  SLG: 'SLG',
  SOE: 'SOE',
}

export function isSchool(value: string | null | undefined): value is School {
  return SCHOOLS.some((school) => school === value)
}

/** Display name for a stored School code. A code since removed from SCHOOLS shows as stored. */
export function schoolLabel(code: string): string {
  return isSchool(code) ? SCHOOL_LABELS[code] : code
}

/**
 * The Schools to report on, in display order: every listed School (so empty ones show as
 * zero), then stored codes no longer listed.
 */
export function schoolBuckets(present: Iterable<string>): string[] {
  const unlisted = [...new Set(present)].filter((code) => !isSchool(code))
  return [...SCHOOLS, ...unlisted.sort()]
}
