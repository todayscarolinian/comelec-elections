import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'
import { SITE_DESCRIPTION, SITE_TITLE, sharedOpenGraph } from '@/lib/site'

// The title and description are the root layout's defaults.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...sharedOpenGraph, title: SITE_TITLE, description: SITE_DESCRIPTION, url: '/' },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
}

export default function Home() {
  return <LandingPage />
}
