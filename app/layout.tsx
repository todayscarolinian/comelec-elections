import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Suspense } from 'react'
import { AnalyticsConsentBanner } from '@/components/analytics/analytics-consent-banner'
import { AnalyticsPageViews } from '@/components/analytics/analytics-page-views'
import { BallotSignInDialog } from '@/components/ballot/ballot-sign-in'
import { LandingScroll } from '@/components/landing/landing-scroll'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_THEME_COLOR,
  SITE_TITLE,
  TITLE_SUFFIX,
  sharedOpenGraph,
  siteUrl,
} from '@/lib/site'
import { TRPCReactProvider } from '@/lib/trpc/client'
import './globals.css'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const antinomiaText = localFont({
  src: '../public/fonts/Antinomia-Text-Regular-TRIAL.ttf',
  variable: '--font-antinomia-text',
  weight: '400',
  style: 'normal',
  display: 'swap',
})

const antinomiaDisplay = localFont({
  src: [
    {
      path: '../public/fonts/Antinomia-Display-Regular-TRIAL.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Antinomia-Display-Italic-TRIAL.ttf',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-antinomia-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    template: `%s | ${TITLE_SUFFIX}`,
    default: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  applicationName: `${SITE_NAME} Elections`,
  // Only site-wide fields: a page's own title and URL must not leak into pages that set none.
  openGraph: sharedOpenGraph,
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = {
  themeColor: SITE_THEME_COLOR,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${antinomiaText.variable} ${antinomiaDisplay.variable} h-full antialiased motion-safe:data-[landing-scroll=true]:scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="bottom-right" richColors />
        <LandingScroll />
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <BallotSignInDialog />
        <Suspense fallback={null}>
          <AnalyticsPageViews />
          <AnalyticsConsentBanner />
        </Suspense>
      </body>
    </html>
  )
}
