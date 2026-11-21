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

/**
 * Display name for a stored School code. A code since removed from SCHOOLS shows as stored,
 * and null (Registrations made before School was collected) shows as "Not recorded".
 */
export function schoolLabel(code: string | null): string {
  if (code === null) return 'Not recorded'
  return isSchool(code) ? SCHOOL_LABELS[code] : code
}

/**
 * The Schools to report on, in display order: every listed School (so empty ones show as
 * zero), then stored codes no longer listed, then null if any record has no School yet.
 */
export function schoolBuckets(present: Iterable<string | null>): (string | null)[] {
  const seen = new Set(present)
  const unlisted = [...seen].filter((code): code is string => code !== null && !isSchool(code))
  return [...SCHOOLS, ...unlisted.sort(), ...(seen.has(null) ? [null] : [])]
}
