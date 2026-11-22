import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ID = 'G-TEST123'

async function loadClient() {
  vi.resetModules()
  const client = await import('../client')
  const consent = await import('../consent')
  return { ...client, ...consent }
}

function gtagScripts() {
  return document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')
}

function commands() {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>))
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', ID)
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  vi.unstubAllEnvs()
  window.localStorage.clear()
  for (const script of gtagScripts()) script.remove()
  delete window.dataLayer
  delete window.gtag
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${ID}`]
})

function collectionDisabled() {
  return (window as unknown as Record<string, unknown>)[`ga-disable-${ID}`]
}

describe('loadAnalytics', () => {
  it('does nothing without consent', async () => {
    const { loadAnalytics } = await loadClient()

    expect(loadAnalytics()).toBe(false)
    expect(gtagScripts()).toHaveLength(0)
    expect(window.dataLayer).toBeUndefined()
  })

  it('does nothing after the visitor declines', async () => {
    const { loadAnalytics, setConsent } = await loadClient()
    setConsent('denied')

    expect(loadAnalytics()).toBe(false)
    expect(gtagScripts()).toHaveLength(0)
  })

  it('does nothing without a measurement ID, even with consent', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '')
    const { loadAnalytics, setConsent } = await loadClient()
    setConsent('granted')

    expect(loadAnalytics()).toBe(false)
    expect(gtagScripts()).toHaveLength(0)
  })

  it('loads gtag.js once with privacy settings after consent', async () => {
    const { loadAnalytics, setConsent } = await loadClient()
    setConsent('granted')

    expect(loadAnalytics()).toBe(true)
    expect(loadAnalytics()).toBe(true)
    expect(gtagScripts()).toHaveLength(1)
    expect(commands()).toContainEqual([
      'config',
      ID,
      expect.objectContaining({
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      }),
    ])
  })
})

describe('trackPageView', () => {
  it('reports the path without its query string', async () => {
    const { setConsent, trackPageView } = await loadClient()
    setConsent('granted')

    trackPageView('/candidates?q=gavas')

    const origin = window.location.origin
    expect(commands()).toContainEqual([
      'set',
      { page_location: `${origin}/candidates`, page_referrer: '' },
    ])
    expect(commands()).toContainEqual(['event', 'page_view', { page_title: document.title }])
  })

  it('uses the previous page as the referrer and skips repeats', async () => {
    const { setConsent, trackPageView } = await loadClient()
    setConsent('granted')
    const origin = window.location.origin

    trackPageView('/candidates')
    trackPageView('/candidates')
    trackPageView('/register')

    expect(commands().filter(([, name]) => name === 'page_view')).toHaveLength(2)
    expect(commands()).toContainEqual([
      'set',
      { page_location: `${origin}/register`, page_referrer: `${origin}/candidates` },
    ])
  })

  it('never reports admin pages or loads gtag.js for them', async () => {
    const { setConsent, trackPageView } = await loadClient()
    setConsent('granted')

    trackPageView('/admin/ballots')

    expect(gtagScripts()).toHaveLength(0)
    expect(window.dataLayer).toBeUndefined()
    expect(collectionDisabled()).toBeUndefined()
  })

  it('pauses collection in the admin area and resumes on public pages', async () => {
    const { setConsent, trackPageView } = await loadClient()
    setConsent('granted')

    trackPageView('/candidates')
    expect(collectionDisabled()).toBe(false)

    trackPageView('/admin/ballots')
    expect(collectionDisabled()).toBe(true)
    expect(commands().filter(([, name]) => name === 'page_view')).toHaveLength(1)

    trackPageView('/register')
    expect(collectionDisabled()).toBe(false)
    expect(commands().filter(([, name]) => name === 'page_view')).toHaveLength(2)
  })
})

describe('trackEvent', () => {
  it('sends funnel events with no parameters', async () => {
    const { setConsent, trackEvent } = await loadClient()
    setConsent('granted')

    trackEvent('ballot_submitted')

    expect(commands()).toContainEqual(['event', 'ballot_submitted'])
  })

  it('sends nothing without consent', async () => {
    const { trackEvent } = await loadClient()

    trackEvent('registration_started')

    expect(window.dataLayer).toBeUndefined()
  })

  it('sends once-only events a single time per page load', async () => {
    const { setConsent, trackEventOnce } = await loadClient()
    setConsent('granted')

    trackEventOnce('ballot_started')
    trackEventOnce('ballot_started')
    trackEventOnce('registration_started')

    const events = commands().filter(([command]) => command === 'event')
    expect(events).toEqual([
      ['event', 'ballot_started'],
      ['event', 'registration_started'],
    ])
  })

  it('still sends a once-only event that was skipped before consent', async () => {
    const { setConsent, trackEventOnce } = await loadClient()

    trackEventOnce('ballot_started')
    setConsent('granted')
    trackEventOnce('ballot_started')

    expect(commands()).toContainEqual(['event', 'ballot_started'])
  })

  it('sends nothing from the admin area', async () => {
    const { setConsent, trackEvent } = await loadClient()
    setConsent('granted')
    window.history.replaceState(null, '', '/admin/registrations')

    trackEvent('registration_submitted')

    expect(window.dataLayer).toBeUndefined()
  })
})

describe('disableAnalytics', () => {
  it('blocks collection and removes Google Analytics cookies', async () => {
    const { disableAnalytics } = await loadClient()
    document.cookie = '_ga=GA1.1.123; path=/'
    document.cookie = '_ga_TEST123=GS1.1.456; path=/'
    document.cookie = 'keep=1; path=/'

    disableAnalytics()

    expect((window as unknown as Record<string, unknown>)[`ga-disable-${ID}`]).toBe(true)
    expect(document.cookie).not.toMatch(/_ga/)
    expect(document.cookie).toContain('keep=1')
    document.cookie = 'keep=; Max-Age=0; path=/'
  })
})
