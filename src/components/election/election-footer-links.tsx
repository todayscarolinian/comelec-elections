import Link from 'next/link'
import { CookieSettingsButton } from '@/components/analytics/cookie-settings-button'
import { contactLinks, legalLinks } from './footer-links'

const linkClass = 'inline-flex min-h-11 items-center hover:underline hover:underline-offset-4'

export function ElectionFooterLinks() {
  return (
    <nav
      aria-label="Footer navigation"
      className="grid min-w-0 border-t border-comelec-sage pt-1 text-sm font-medium min-[38rem]:flex min-[38rem]:flex-wrap min-[38rem]:items-center min-[38rem]:justify-center min-[38rem]:gap-x-4 min-[38rem]:border-t-0 min-[38rem]:pt-0 min-[64rem]:justify-end"
    >
      <div className="flex items-center justify-center min-[38rem]:gap-x-4">
        {contactLinks.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            className={`${linkClass} min-w-11 justify-center gap-1.5 min-[38rem]:min-w-0`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="sr-only min-[38rem]:not-sr-only">{label}</span>
          </a>
        ))}
      </div>
      <div className="relative flex flex-wrap justify-center gap-x-4 max-[38rem]:mt-1 min-[38rem]:ps-4 min-[38rem]:before:absolute min-[38rem]:before:start-0 min-[38rem]:before:top-1/2 min-[38rem]:before:h-4 min-[38rem]:before:w-px min-[38rem]:before:-translate-y-1/2 min-[38rem]:before:bg-comelec-sage">
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
