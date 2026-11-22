/**
 * The path to report for a page, or null for pages that are never tracked. Query strings and
 * hashes are dropped because they can hold what visitors type, such as candidate search terms.
 */
export function trackablePath(pathname: string): string | null {
  const path = pathname.split(/[?#]/, 1)[0] || '/'
  if (path === '/admin' || path.startsWith('/admin/')) return null
  return path
}

/** A referrer safe to report: same-site referrers lose their query string, others keep only their origin. */
export function safeReferrer(referrer: string, siteOrigin: string): string {
  let url: URL
  try {
    url = new URL(referrer)
  } catch {
    return ''
  }
  if (url.origin !== siteOrigin) return url.origin
  const path = trackablePath(url.pathname)
  return path ? `${url.origin}${path}` : ''
}
