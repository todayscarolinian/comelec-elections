import 'client-only'
import { measurementId } from './config'
import { getConsent } from './consent'
import { safeReferrer, trackablePath } from './paths'

export type FunnelEvent =
  'registration_started' | 'registration_submitted' | 'ballot_started' | 'ballot_submitted'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let loadedId: string | null = null
let lastLocation: string | null = null
const sentOnce = new Set<FunnelEvent>()

function gtag(...args: unknown[]): void {
  window.gtag?.(...args)
}

/** Loads gtag.js once, and only when a measurement ID is configured and the visitor has accepted. */
export function loadAnalytics(): boolean {
  if (loadedId) return true
  const id = measurementId()
  if (!id || getConsent() !== 'granted') return false

  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer!.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(process.env.NODE_ENV !== 'production' && { debug_mode: true }),
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)

  loadedId = id
  return true
}

export function trackPageView(pathname: string): void {
  const path = trackablePath(pathname)
  if (!path || !loadAnalytics()) return
  const origin = window.location.origin
  const location = `${origin}${path}`
  if (location === lastLocation) return
  const referrer = lastLocation ?? safeReferrer(document.referrer, origin)
  gtag('set', { page_location: location, page_referrer: referrer })
  gtag('event', 'page_view', { page_title: document.title })
  lastLocation = location
}

export function trackEvent(name: FunnelEvent): boolean {
  if (!trackablePath(window.location.pathname) || !loadAnalytics()) return false
  gtag('event', name)
  return true
}

/** Sends an event at most once per page load, so remounts don't inflate funnel counts. */
export function trackEventOnce(name: FunnelEvent): void {
  if (sentOnce.has(name)) return
  if (trackEvent(name)) sentOnce.add(name)
}

/** Stops collection, removes Google Analytics cookies, and reloads so gtag.js is gone. */
export function disableAnalytics(): void {
  const id = loadedId ?? measurementId()
  if (id) (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = true
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
  const labels = window.location.hostname.split('.')
  const domains = labels.map((_, index) => labels.slice(index).join('.'))
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`
  }
  if (loadedId) window.location.reload()
}
