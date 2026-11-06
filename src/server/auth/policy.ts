export function isAllowedGoogleProfile(
  profile: unknown,
  allowedDomain: string | undefined,
): boolean {
  if (!allowedDomain?.trim() || !profile || typeof profile !== 'object') return false

  return (
    'hd' in profile &&
    profile.hd === allowedDomain &&
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
