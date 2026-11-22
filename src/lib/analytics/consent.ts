import { useSyncExternalStore } from 'react'

export type AnalyticsConsent = 'granted' | 'denied'

export const CONSENT_STORAGE_KEY = 'analytics-consent'

const listeners = new Set<() => void>()

export function getConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function setConsent(value: AnalyticsConsent | null): void {
  try {
    if (value) window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
    else window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {}
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * The visitor's stored choice: null when they haven't chosen yet, and undefined while it can't be
 * read (on the server and during hydration).
 */
export function useAnalyticsConsent(): AnalyticsConsent | null | undefined {
  return useSyncExternalStore(subscribe, getConsent, () => undefined)
}
