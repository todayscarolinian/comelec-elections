import { describe, expect, it } from 'vitest'
import { TITLE_SUFFIX, pageMetadata, sharedOpenGraph, siteUrl } from '../site'

describe('siteUrl', () => {
  it('prefers AUTH_URL', () => {
    expect(
      siteUrl({ AUTH_URL: 'https://vote.example.org', VERCEL_URL: 'preview.vercel.app' }).href,
    ).toBe('https://vote.example.org/')
  })

  it('falls back to the Vercel production hostname, then the deployment hostname', () => {
    expect(
      siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'vote.example.org', VERCEL_URL: 'x.vercel.app' })
        .href,
    ).toBe('https://vote.example.org/')
    expect(siteUrl({ VERCEL_URL: 'x.vercel.app' }).href).toBe('https://x.vercel.app/')
  })

  it('ignores blank or malformed values and defaults to localhost', () => {
    expect(siteUrl({ AUTH_URL: '   ', VERCEL_URL: '' }).href).toBe('http://localhost:3000/')
    expect(siteUrl({ AUTH_URL: 'not a url' }).href).toBe('http://localhost:3000/')
  })
})

describe('pageMetadata', () => {
  it('keeps the shared Open Graph image alongside the page title and URL', () => {
    const metadata = pageMetadata({ title: 'Terms', description: 'Rules.', path: '/terms' })

    expect(metadata.title).toBe('Terms')
    expect(metadata.alternates?.canonical).toBe('/terms')
    expect(metadata.openGraph).toMatchObject({
      title: `Terms | ${TITLE_SUFFIX}`,
      description: 'Rules.',
      url: '/terms',
      images: sharedOpenGraph.images,
    })
  })
})
