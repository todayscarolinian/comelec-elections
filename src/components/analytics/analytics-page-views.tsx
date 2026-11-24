'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { trackPageView } from '@/lib/analytics/client'
import { useAnalyticsConsent } from '@/lib/analytics/consent'

export function AnalyticsPageViews() {
  const pathname = usePathname()
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if (consent === 'granted') trackPageView(pathname)
  }, [consent, pathname])

  return null
}
