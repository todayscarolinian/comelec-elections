'use client'

import { disableAnalytics } from '@/lib/analytics/client'
import { measurementId } from '@/lib/analytics/config'
import { getConsent, setConsent } from '@/lib/analytics/consent'

export function CookieSettingsButton({ className }: { className?: string }) {
  if (!measurementId()) return null

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const wasGranted = getConsent() === 'granted'
        setConsent(null)
        if (wasGranted) disableAnalytics()
      }}
    >
      Cookie settings
    </button>
  )
}
