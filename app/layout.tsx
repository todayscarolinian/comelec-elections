import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { LandingScroll } from '@/components/landing/landing-scroll'
import { TRPCReactProvider } from '@/lib/trpc/client'
import './globals.css'

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
  title: {
    default: 'SSC Elections 2026 | COMELEC',
    template: '%s | SSC Elections 2026',
  },
  description:
    'Meet the candidates, check election dates, and get ready to vote in the SSC Elections.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${antinomiaText.variable} ${antinomiaDisplay.variable} h-full antialiased motion-safe:data-[landing-scroll=true]:scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <LandingScroll />
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}
