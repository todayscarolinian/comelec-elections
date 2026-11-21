import Image from 'next/image'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { BallotEntry } from '@/components/ballot/ballot-entry'
import { ElectionNavigation } from './election-navigation'
import { legalLinks } from './footer-links'
import { footerGutters } from './election-styles'

const inter = Inter({ subsets: ['latin'], variable: '--registration-body' })
const display = localFont({
  src: '../../../public/fonts/antimonia/Antinomia-Display-Italic-TRIAL.ttf',
  style: 'italic',
  variable: '--registration-display',
})
const text = localFont({
  src: '../../../public/fonts/antimonia/Antinomia-Text-Regular-TRIAL.ttf',
  variable: '--registration-text',
  preload: false,
})

const footerLinkClass = 'inline-flex min-h-11 items-center hover:underline hover:underline-offset-4'

export const contentGutters = 'w-full px-(--registration-inset)'

type ElectionPageShellProps = {
  /** The id of the page's `<main>`, which the skip link targets. */
  contentId: string
  skipLabel: string
  /** Hide the navigation's sign-in action, e.g. on the sign-in page itself. */
  hideSignIn?: boolean
  children: ReactNode
}

/** Navigation, fonts, colours and footer shared by the standalone (non-landing) election pages. */
export function ElectionPageShell({
  contentId,
  skipLabel,
  hideSignIn = false,
  children,
}: ElectionPageShellProps) {
  return (
    <div
      className={`flex min-h-svh flex-1 flex-col bg-[#faf3e0] text-[#324e1f] [--registration-inset:clamp(1rem,1.67vw,1.5rem)] [font-family:var(--registration-body),Arial,sans-serif] [&_:is(a,button,select):focus-visible]:outline-2 [&_:is(a,button,select):focus-visible]:outline-offset-4 ${inter.variable} ${display.variable} ${text.variable}`}
    >
      <a
        href={`#${contentId}`}
        className="absolute start-4 top-4 z-30 -translate-y-[calc(100%+1rem)] bg-[#faf3e0] px-4 py-3 focus:translate-y-0"
      >
        {skipLabel}
      </a>
      <div className="flex min-h-svh flex-col">
        <ElectionNavigation hideSignIn={hideSignIn} />
        {children}
      </div>
      <footer className={footerGutters}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#b6c89f] py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="SSC COMELEC home">
            <Image src="/landing/mark.webp" alt="" width={56} height={56} />
            <span>
              <span className="block text-[clamp(1.5rem,2.5vw,2.25rem)] leading-tight [font-family:var(--registration-text),Georgia,serif]">
                SSC COMELEC
              </span>
              <span className="block text-sm text-[#56654a]">
                Supreme Student Council Elections · 2026
              </span>
            </span>
          </Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 text-sm">
            <Link className={footerLinkClass} href="/candidates">
              Candidates
            </Link>
            <BallotEntry className={`${footerLinkClass} cursor-pointer`} />
            {legalLinks.map(({ href, label }) => (
              <Link key={href} className={footerLinkClass} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
