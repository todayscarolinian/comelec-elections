// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isAllowedGoogleProfile, normalizeEmail, normalizeHostedDomain } from '../policy'

const member = {
  hd: 'example.com',
  email_verified: true,
  email: 'member@example.com',
}

describe('Google sign-in policy', () => {
  it('accepts a verified Workspace member of the configured domain', () => {
    expect(isAllowedGoogleProfile(member, 'example.com')).toBe(true)
  })

  it('normalizes the configured domain before comparing it with the Google claim', () => {
    expect(isAllowedGoogleProfile(member, ' ExAmPlE.CoM ')).toBe(true)
    expect(isAllowedGoogleProfile({ ...member, hd: 'foreign.example' }, ' ExAmPlE.CoM ')).toBe(
      false,
    )
  })

  it.each([undefined, null, {}, 'profile', []])(
    'rejects an absent or invalid profile: %j',
    (profile) => {
      expect(isAllowedGoogleProfile(profile, 'example.com')).toBe(false)
    },
  )

  it.each([undefined, '', '   '])('rejects missing domain configuration: %j', (domain) => {
    expect(isAllowedGoogleProfile(member, domain)).toBe(false)
    expect(isAllowedGoogleProfile({ ...member, hd: undefined }, domain)).toBe(false)
  })

  it.each([undefined, '', 'foreign.example', 'sub.example.com', 'EXAMPLE.COM'])(
    'rejects nonmatching hd: %j',
    (hd) => {
      expect(isAllowedGoogleProfile({ ...member, hd }, 'example.com')).toBe(false)
    },
  )

  it.each([undefined, false, 'true', 1])(
    'requires literal verified-email true: %j',
    (email_verified) => {
      expect(isAllowedGoogleProfile({ ...member, email_verified }, 'example.com')).toBe(false)
    },
  )

  it.each([undefined, null, '', '   ', 42])('requires a nonempty email: %j', (email) => {
    expect(isAllowedGoogleProfile({ ...member, email }, 'example.com')).toBe(false)
  })

  it('does not accept an university-looking personal account without hd', () => {
    expect(
      isAllowedGoogleProfile({ email: 'member@example.com', email_verified: true }, 'example.com'),
    ).toBe(false)
  })
})

describe('normalizeHostedDomain', () => {
  it.each([
    [undefined, undefined],
    ['', undefined],
    [' \t\n ', undefined],
    ['usc.edu.ph', 'usc.edu.ph'],
    ['USC.EDU.PH', 'usc.edu.ph'],
    [' USC.EDU.PH ', 'usc.edu.ph'],
  ])('normalizes %j to %j', (domain, expected) => {
    expect(normalizeHostedDomain(domain)).toBe(expected)
  })
})

describe('normalizeEmail', () => {
  it('trims whitespace and lowercases the email', () => {
    expect(normalizeEmail(' Member@Example.com ')).toBe('member@example.com')
  })

  it('preserves address semantics rather than removing dots or plus tags', () => {
    expect(normalizeEmail(' First.Last+Election@Example.com ')).toBe(
      'first.last+election@example.com',
    )
  })
})
