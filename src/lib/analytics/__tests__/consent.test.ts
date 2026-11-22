import { afterEach, describe, expect, it, vi } from 'vitest'
import { measurementId } from '../config'
import { CONSENT_STORAGE_KEY, getConsent, setConsent } from '../consent'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('consent storage', () => {
  it('is unset until the visitor chooses', () => {
    expect(getConsent()).toBeNull()
  })

  it('round-trips a choice and clears it', () => {
    setConsent('granted')
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted')
    expect(getConsent()).toBe('granted')

    setConsent('denied')
    expect(getConsent()).toBe('denied')

    setConsent(null)
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull()
    expect(getConsent()).toBeNull()
  })

  it('ignores unexpected stored values', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'yes')
    expect(getConsent()).toBeNull()
  })

  it('treats blocked storage as unset without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => setConsent('granted')).not.toThrow()
    expect(getConsent()).toBeNull()
  })
})

describe('measurementId', () => {
  it('accepts a GA4 measurement ID', () => {
    expect(measurementId('G-ABC123XYZ')).toBe('G-ABC123XYZ')
    expect(measurementId('  G-ABC123XYZ  ')).toBe('G-ABC123XYZ')
  })

  it('disables analytics when unset or malformed', () => {
    expect(measurementId(undefined)).toBeNull()
    expect(measurementId('')).toBeNull()
    expect(measurementId('UA-12345-1')).toBeNull()
    expect(measurementId('G-abc"><script>')).toBeNull()
  })
})
