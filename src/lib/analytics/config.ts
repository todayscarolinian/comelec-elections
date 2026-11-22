const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/

/**
 * The GA4 measurement ID, or null when unset or malformed. Analytics and the consent banner are
 * disabled entirely when this is null, which is the case everywhere except production.
 */
export function measurementId(
  value: string | undefined = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
): string | null {
  const trimmed = value?.trim()
  return trimmed && MEASUREMENT_ID_PATTERN.test(trimmed) ? trimmed : null
}
