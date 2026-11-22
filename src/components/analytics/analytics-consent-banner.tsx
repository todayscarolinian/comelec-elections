'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { measurementId } from '@/lib/analytics/config'
import { setConsent, useAnalyticsConsent } from '@/lib/analytics/consent'
import { trackablePath } from '@/lib/analytics/paths'

const buttonClass =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[#324e1f] px-5 text-sm font-medium'

export function AnalyticsConsentBanner() {
  const pathname = usePathname()
  const consent = useAnalyticsConsent()

  if (!measurementId() || consent !== null || !trackablePath(pathname)) return null

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-2xl flex-wrap items-center gap-4 rounded-2xl border border-[#b6c89f] bg-[#faf3e0] p-5 text-[#324e1f] shadow-lg"
    >
      <p className="min-w-60 flex-1 text-sm">
        We use cookies to count visits and improve this site. We never collect your name or your
        vote.{' '}
        <Link href="/privacy#cookies" className="underline underline-offset-4">
          Learn more
        </Link>
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className={`${buttonClass} bg-[#324e1f] text-[#faf3e0]`}
          onClick={() => setConsent('granted')}
        >
          Accept
        </button>
        <button
          type="button"
          className={`${buttonClass} bg-[#faf3e0]`}
          onClick={() => setConsent('denied')}
        >
          Decline
        </button>
      </div>
    </section>
  )
}
