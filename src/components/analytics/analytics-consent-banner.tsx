'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { footerGutters } from '@/components/election/election-styles'
import { measurementId } from '@/lib/analytics/config'
import { setConsent, useAnalyticsConsent } from '@/lib/analytics/consent'
import { trackablePath } from '@/lib/analytics/paths'

const buttonClass =
  'inline-flex min-h-12 min-w-28 cursor-pointer items-center justify-center rounded-full border-2 border-[#324e1f] px-6 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#324e1f]'

export function AnalyticsConsentBanner() {
  const pathname = usePathname()
  const consent = useAnalyticsConsent()

  if (!measurementId() || consent !== null || !trackablePath(pathname)) return null

  return (
    <section
      aria-label="Cookie consent"
      className="sticky bottom-0 z-30 w-full border-t-4 border-[#324e1f] bg-[#faf3e0] text-[#324e1f] shadow-[0_-16px_48px_rgb(10_20_5/28%)] transition-transform duration-500 ease-out starting:translate-y-full motion-reduce:transition-none [body:has(#election-tab-bar)_&]:max-[38rem]:bottom-[calc(5.25rem+env(safe-area-inset-bottom))]"
    >
      <div
        className={`${footerGutters} flex flex-wrap items-center justify-between gap-x-8 gap-y-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]`}
      >
        <p className="max-w-3xl flex-1 basis-72 text-base leading-relaxed">
          We use cookies to count visits and improve this site. We never collect your name or your
          vote.{' '}
          <Link href="/privacy#cookies" className="font-medium underline underline-offset-4">
            Learn more
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            className={`${buttonClass} bg-[#324e1f] text-[#faf3e0]`}
            onClick={() => setConsent('granted')}
          >
            Accept
          </button>
          <button
            type="button"
            className={`${buttonClass} bg-transparent`}
            onClick={() => setConsent('denied')}
          >
            Decline
          </button>
        </div>
      </div>
    </section>
  )
}
