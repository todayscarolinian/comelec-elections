export function isAllowedOrigin(req: Request, authUrl?: string): boolean {
  if (req.method !== 'POST') return true

  const origin = req.headers.get('origin')
  if (!origin) return false

  try {
    const expected = new URL(authUrl || req.url).origin
    return new URL(origin).origin === expected
  } catch {
    return false
  }
}
