export function isAllowedGoogleProfile(
  profile: unknown,
  allowedDomain: string | undefined,
): boolean {
  const domain = normalizeHostedDomain(allowedDomain)
  if (!domain || !profile || typeof profile !== 'object') return false

  return (
    'hd' in profile &&
    profile.hd === domain &&
    'email_verified' in profile &&
    profile.email_verified === true &&
    'email' in profile &&
    typeof profile.email === 'string' &&
    profile.email.trim().length > 0
  )
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeHostedDomain(domain: string | undefined): string | undefined {
  const normalized = domain?.trim().toLowerCase()
  return normalized || undefined
}
