import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pathname = vi.hoisted(() => ({ current: '/' }))

vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }))

async function renderAnalytics() {
  vi.resetModules()
  const { AnalyticsConsentBanner } = await import('../analytics-consent-banner')
  const { AnalyticsPageViews } = await import('../analytics-page-views')
  const { CookieSettingsButton } = await import('../cookie-settings-button')
  const consent = await import('@/lib/analytics/consent')
  render(
    <>
      <AnalyticsPageViews />
      <AnalyticsConsentBanner />
      <CookieSettingsButton />
    </>,
  )
  return consent
}

function banner() {
  return screen.queryByRole('region', { name: 'Cookie consent' })
}

function gtagScripts() {
  return document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123')
  pathname.current = '/'
})

afterEach(() => {
  vi.unstubAllEnvs()
  window.localStorage.clear()
  for (const script of gtagScripts()) script.remove()
  delete window.dataLayer
  delete window.gtag
})

describe('analytics consent', () => {
  it('links to cookie information when analytics is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '')
    await renderAnalytics()

    expect(banner()).toBeNull()
    expect(screen.getByRole('link', { name: 'Cookie settings' }).getAttribute('href')).toBe(
      '/privacy#cookies',
    )
    expect(gtagScripts()).toHaveLength(0)
  })

  it('asks first-time visitors and loads nothing until they choose', async () => {
    await renderAnalytics()

    expect(banner()).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Learn more' }).getAttribute('href')).toBe(
      '/privacy#cookies',
    )
    expect(gtagScripts()).toHaveLength(0)
  })

  it('never loads Google Analytics after the visitor declines', async () => {
    const { getConsent } = await renderAnalytics()

    fireEvent.click(screen.getByRole('button', { name: 'Decline' }))

    expect(getConsent()).toBe('denied')
    expect(banner()).toBeNull()
    expect(gtagScripts()).toHaveLength(0)
    expect(window.dataLayer).toBeUndefined()
  })

  it('loads Google Analytics and sends a page view after the visitor accepts', async () => {
    pathname.current = '/candidates'
    const { getConsent } = await renderAnalytics()

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))

    expect(getConsent()).toBe('granted')
    expect(banner()).toBeNull()
    expect(gtagScripts()).toHaveLength(1)
    const events = (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>))
    expect(events).toContainEqual(['event', 'page_view', expect.anything()])
  })

  it('stays hidden for visitors who already chose', async () => {
    window.localStorage.setItem('analytics-consent', 'denied')
    await renderAnalytics()

    expect(banner()).toBeNull()
  })

  it('never shows the banner or loads analytics in the admin area', async () => {
    pathname.current = '/admin/ballots'
    await renderAnalytics()

    expect(banner()).toBeNull()

    window.localStorage.setItem('analytics-consent', 'granted')
    await renderAnalytics()

    expect(gtagScripts()).toHaveLength(0)
  })

  it('lets visitors reopen the banner from Cookie settings', async () => {
    window.localStorage.setItem('analytics-consent', 'denied')
    const { getConsent } = await renderAnalytics()
    expect(banner()).toBeNull()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }))
    })

    expect(getConsent()).toBeNull()
    expect(banner()).not.toBeNull()
  })
})
