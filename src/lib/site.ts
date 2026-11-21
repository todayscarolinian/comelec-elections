import type { Metadata } from 'next'

export const SITE_NAME = 'SSC COMELEC'
export const SITE_TITLE = 'SSC Elections 2026 | COMELEC'
/** Appended to every page title by the root layout's title template. */
export const TITLE_SUFFIX = 'SSC Elections 2026'
export const SITE_DESCRIPTION =
  'Meet the candidates, check election dates, and get ready to vote in the SSC Elections.'
export const SITE_THEME_COLOR = '#faf3e0'

const LOCAL_URL = 'http://localhost:3000'

type SiteEnv = Record<string, string | undefined>

function parseUrl(value: string | undefined, assumeHttps: boolean): URL | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    return new URL(/^https?:\/\//i.test(trimmed) || !assumeHttps ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
}

/**
 * The public base URL used to resolve absolute metadata URLs (Open Graph images, canonical links).
 * Prefers the configured `AUTH_URL`, then Vercel's production and deployment hostnames.
 */
export function siteUrl(env: SiteEnv = process.env): URL {
  return (
    parseUrl(env.AUTH_URL, false) ??
    parseUrl(env.VERCEL_PROJECT_PRODUCTION_URL, true) ??
    parseUrl(env.VERCEL_URL, true) ??
    new URL(LOCAL_URL)
  )
}

export const sharedOpenGraph = {
  type: 'website',
  siteName: SITE_NAME,
  locale: 'en_PH',
  images: [
    {
      url: '/landing/hero.webp',
      width: 1440,
      height: 800,
      alt: 'SSC Elections 2026',
    },
  ],
} satisfies NonNullable<Metadata['openGraph']>

type PageMetadataInput = {
  /** Page title; the root layout's template adds the site name. */
  title: string
  description: string
  path: `/${string}`
}

/**
 * Metadata for a single page. Child `openGraph` objects replace the parent's entirely, so the
 * shared Open Graph fields are repeated here alongside the page's own title and URL.
 */
export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...sharedOpenGraph, title: `${title} | ${TITLE_SUFFIX}`, description, url: path },
    twitter: { card: 'summary_large_image', title: `${title} | ${TITLE_SUFFIX}`, description },
  }
}
