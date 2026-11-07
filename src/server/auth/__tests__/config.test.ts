// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { JWT } from 'next-auth/jwt'
import { createAuthConfig } from '../config'

const SIGNED_IN_AT = Date.parse('2026-11-07T00:00:00.000Z')
const profile = { hd: 'example.com', email_verified: true, email: ' Member@Example.com ' }
const user = { id: 'google-subject', email: profile.email, name: 'Member' }
const account = {
  provider: 'google',
  type: 'oidc' as const,
  providerAccountId: 'google-subject',
  access_token: 'private-access-token',
  refresh_token: 'private-refresh-token',
  id_token: 'private-id-token',
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(SIGNED_IN_AT)
})

afterEach(() => vi.useRealTimers())

describe('Auth.js configuration', () => {
  const config = createAuthConfig('example.com')

  it('uses eight-hour JWT sessions without a database adapter', () => {
    expect(config.session).toEqual({ strategy: 'jwt', maxAge: 28_800 })
    expect(config.adapter).toBeUndefined()
    expect(config.pages?.error).toBe('/auth/error')
  })

  it('accepts a verified member through the actual signIn callback', async () => {
    await expect(config.callbacks!.signIn!({ user, account, profile })).resolves.toBe(true)
  })

  it('uses the normalized configured domain in the signIn callback', async () => {
    const normalizedConfig = createAuthConfig(' ExAmPlE.CoM ')
    expect(await normalizedConfig.callbacks!.signIn!({ user, account, profile })).toBe(true)
  })

  it.each([
    undefined,
    { ...profile, hd: undefined },
    { ...profile, hd: 'foreign.example' },
    { ...profile, email_verified: false },
  ])('rejects invalid claims through signIn: %j', async (invalidProfile) => {
    expect(await config.callbacks!.signIn!({ user, account, profile: invalidProfile })).toBe(false)
  })

  it('fails closed without a configured domain', async () => {
    const missingDomain = createAuthConfig(undefined)
    expect(
      await missingDomain.callbacks!.signIn!({
        user,
        account,
        profile: { ...profile, hd: undefined },
      }),
    ).toBe(false)
  })

  it('normalizes the email and drops provider tokens, profile data and provider identity from JWTs', async () => {
    const token = await config.callbacks!.jwt!({
      token: {
        sub: user.id,
        email: profile.email,
        name: user.name,
        picture: 'https://example.com/avatar.png',
        access_token: account.access_token,
        signedInAt: SIGNED_IN_AT - 28_800_000,
      },
      user,
      account,
      profile,
      trigger: 'signIn',
    })
    expect(token).toEqual({ email: 'member@example.com', signedInAt: SIGNED_IN_AT })
  })

  it('keeps the trusted email on client-triggered updates', async () => {
    vi.setSystemTime(SIGNED_IN_AT + 14_400_000)
    const token = await config.callbacks!.jwt!({
      token: {
        email: 'member@example.com',
        signedInAt: SIGNED_IN_AT,
        iat: 100,
        exp: 200,
        jti: 'jwt-id',
      },
      user,
      trigger: 'update',
      session: {
        email: 'attacker@foreign.example',
        signedInAt: Date.now(),
        user: { email: 'attacker@foreign.example', personId: 'fake' },
      },
    })
    expect(token).toEqual({ email: 'member@example.com', signedInAt: SIGNED_IN_AT })
  })

  it('records server time on the initial sign-up callback', async () => {
    const token = await config.callbacks!.jwt!({
      token: { email: profile.email, signedInAt: SIGNED_IN_AT - 1_000 },
      user,
      account,
      profile,
      trigger: 'signUp',
    })
    expect(token).toEqual({ email: 'member@example.com', signedInAt: SIGNED_IN_AT })
  })

  it.each([
    [0, true],
    [28_799_999, true],
    [28_800_000, false],
    [28_800_001, false],
  ])('enforces the absolute deadline at age %i milliseconds', async (age, valid) => {
    vi.setSystemTime(SIGNED_IN_AT + age)
    const token = await config.callbacks!.jwt!({
      token: { email: 'member@example.com', signedInAt: SIGNED_IN_AT },
      user,
    })
    expect(token).toEqual(valid ? { email: 'member@example.com', signedInAt: SIGNED_IN_AT } : null)
  })

  it('preserves the original sign-in time across repeated session reads', async () => {
    let token: JWT = { email: 'member@example.com', signedInAt: SIGNED_IN_AT }
    for (const elapsed of [3_600_000, 14_400_000, 25_200_000]) {
      vi.setSystemTime(SIGNED_IN_AT + elapsed)
      const refreshed = await config.callbacks!.jwt!({ token, user })
      expect(refreshed).toEqual({ email: 'member@example.com', signedInAt: SIGNED_IN_AT })
      token = refreshed!
    }
    vi.setSystemTime(SIGNED_IN_AT + 28_800_000)
    expect(await config.callbacks!.jwt!({ token, user })).toBeNull()
  })

  it('does not revive an expired session through a client update', async () => {
    vi.setSystemTime(SIGNED_IN_AT + 28_800_000)
    expect(
      await config.callbacks!.jwt!({
        token: { email: 'member@example.com', signedInAt: SIGNED_IN_AT },
        user,
        trigger: 'update',
        session: { signedInAt: Date.now(), user: { email: 'member@example.com' } },
      }),
    ).toBeNull()
  })

  it.each([
    ['missing', undefined],
    ['null', null],
    ['string', String(SIGNED_IN_AT)],
    ['NaN', NaN],
    ['infinite', Infinity],
    ['negative', -1],
    ['fractional', SIGNED_IN_AT + 0.5],
    ['future', SIGNED_IN_AT + 1],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1],
  ])('rejects a %s sign-in timestamp', async (_label, signedInAt) => {
    expect(
      await config.callbacks!.jwt!({
        token: { email: 'member@example.com', signedInAt },
        user,
      }),
    ).toBeNull()
  })

  it.each([undefined, null, '', '   '])(
    'does not issue a token without a usable trusted email: %j',
    async (email) => {
      expect(
        await config.callbacks!.jwt!({ token: { email, signedInAt: SIGNED_IN_AT }, user }),
      ).toBeNull()
    },
  )
})
