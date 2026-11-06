// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isAllowedOrigin } from '../origin'

const APP = 'https://vote.example.org'
const ENDPOINT = `${APP}/api/trpc/health.ping`

function req(method: string, origin?: string, url = ENDPOINT) {
  const headers = new Headers()
  if (origin) headers.set('origin', origin)
  return new Request(url, { method, headers })
}

describe('isAllowedOrigin', () => {
  it('allows GET with any or no Origin', () => {
    expect(isAllowedOrigin(req('GET'), APP)).toBe(true)
    expect(isAllowedOrigin(req('GET', 'https://evil.test'), APP)).toBe(true)
  })

  it('allows POST with a matching Origin', () => {
    expect(isAllowedOrigin(req('POST', APP), APP)).toBe(true)
    expect(isAllowedOrigin(req('POST', APP), `${APP}/some/path`)).toBe(true)
  })

  it('rejects POST with a foreign Origin', () => {
    expect(isAllowedOrigin(req('POST', 'https://evil.test'), APP)).toBe(false)
    expect(isAllowedOrigin(req('POST', 'http://vote.example.org'), APP)).toBe(false)
  })

  it('rejects POST with no Origin', () => {
    expect(isAllowedOrigin(req('POST'), APP)).toBe(false)
  })

  it('rejects POST with a malformed Origin', () => {
    expect(isAllowedOrigin(req('POST', 'null'), APP)).toBe(false)
  })

  it('falls back to the request origin when AUTH_URL is unset', () => {
    expect(isAllowedOrigin(req('POST', APP), undefined)).toBe(true)
    expect(isAllowedOrigin(req('POST', 'https://evil.test'), undefined)).toBe(false)
  })
})
