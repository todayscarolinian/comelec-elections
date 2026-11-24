import Link from 'next/link'
import { CookieSettingsButton } from '@/components/analytics/cookie-settings-button'
import { contactLinks, legalLinks } from './footer-links'

const linkClass = 'inline-flex min-h-11 items-center hover:underline hover:underline-offset-4'

export function ElectionFooterLinks() {
  return (
    <nav
      aria-label="Footer navigation"
      className="flex flex-wrap items-center justify-end gap-x-2 text-sm font-medium min-[38rem]:gap-x-4"
    >
      <div className="flex items-center min-[38rem]:gap-x-4">
        {contactLinks.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            className={`${linkClass} min-w-8 justify-center gap-1.5 min-[38rem]:min-w-0`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="sr-only min-[38rem]:not-sr-only">{label}</span>
          </a>
        ))}
      </div>
      <div className="relative flex flex-wrap justify-end gap-x-2 ps-2 before:absolute before:start-0 before:top-1/2 before:h-4 before:w-px before:-translate-y-1/2 before:bg-comelec-sage min-[38rem]:gap-x-4 min-[38rem]:ps-4">
        {legalLinks.map(({ href, label }) => (
          <Link key={href} href={href} className={linkClass}>
            {label}
          </Link>
        ))}
        <CookieSettingsButton className={`${linkClass} cursor-pointer`} />
      </div>
    </nav>
  )
}
