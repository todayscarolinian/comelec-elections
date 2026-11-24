import { footerGutters } from '@/components/election/election-styles'
import Link from 'next/link'
import { BallotEntry } from '@/components/ballot/ballot-entry'
import { CookieSettingsButton } from '@/components/analytics/cookie-settings-button'
import { ElectionFooterBrand } from '@/components/election/election-footer-brand'
import { legalLinks } from '@/components/election/footer-links'

export function ElectionFooter() {
  return (
    <footer className="mt-auto">
      <div
        className={`${footerGutters} flex min-h-[7.5rem] items-center justify-between gap-5 py-5 max-[38rem]:flex-col max-[38rem]:items-start`}
      >
        <ElectionFooterBrand />
        <nav
          className="flex flex-wrap gap-x-6 text-sm [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:font-medium [&_a:hover]:underline [&_a:hover]:underline-offset-4"
          aria-label="Footer navigation"
        >
          <Link href="/candidates">Candidates</Link>
          <Link href="/register">Registration</Link>
          <BallotEntry />
          {legalLinks.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <CookieSettingsButton className="inline-flex min-h-11 cursor-pointer items-center font-medium hover:underline hover:underline-offset-4" />
        </nav>
      </div>
    </footer>
  )
}
