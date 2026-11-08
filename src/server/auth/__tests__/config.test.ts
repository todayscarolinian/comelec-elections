// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { JWT } from 'next-auth/jwt'
import { createAuthConfig } from '../config'
import { upsertPerson } from '../person'

vi.mock('../person', () => ({ upsertPerson: vi.fn() }))

const SIGNED_IN_AT = Date.parse('2026-11-07T00:00:00.000Z')
const identity = { personId: 'test-person-id', email: 'member@example.com' }
const validToken = { ...identity, signedInAt: SIGNED_IN_AT }
const profile = { hd: 'example.com', email_verified: true, email: ' Member@Example.com ' }
const user = { id: 'google-subject', email: profile.email, name: 'Member' }
const googleUser = (): { id: string; email: string; name: string; personId?: string } => ({
  ...user,
})
const storedPerson = { id: 'db-person-id', email: 'member@example.com' }
const signedInUser = { ...user, personId: storedPerson.id, email: storedPerson.email }
const issuedToken = {
  personId: storedPerson.id,
  email: storedPerson.email,
  signedInAt: SIGNED_IN_AT,
}
const account = {
  provider: 'google',
  type: 'oidc' as const,
  providerAccountId: 'google-subject',
  access_token: 'private-access-token',
  refresh_token: 'private-refresh-token',
  id_token: 'private-id-token',
}

beforeEach(() => {
  vi.mocked(upsertPerson).mockReset()
  vi.mocked(upsertPerson).mockResolvedValue(storedPerson)
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

  it('accepts a verified member and attaches the stored Person to the user', async () => {
    const signingIn = googleUser()
    await expect(config.callbacks!.signIn!({ user: signingIn, account, profile })).resolves.toBe(
      true,
    )
    expect(upsertPerson).toHaveBeenCalledExactlyOnceWith(profile.email, 'member@example.com')
    expect(signingIn).toMatchObject({ personId: storedPerson.id, email: storedPerson.email })
  })

  it('uses the normalized configured domain in the signIn callback', async () => {
    const normalizedConfig = createAuthConfig(' ExAmPlE.CoM ')
    expect(
      await normalizedConfig.callbacks!.signIn!({ user: googleUser(), account, profile }),
    ).toBe(true)
  })

  it.each([
    undefined,
    { ...profile, hd: undefined },
    { ...profile, hd: 'foreign.example' },
    { ...profile, email_verified: false },
  ])('rejects invalid claims through signIn: %j', async (invalidProfile) => {
    expect(
      await config.callbacks!.signIn!({ user: googleUser(), account, profile: invalidProfile }),
    ).toBe(false)
    expect(upsertPerson).not.toHaveBeenCalled()
  })

  it('fails closed without a configured domain', async () => {
    const missingDomain = createAuthConfig(undefined)
    expect(
      await missingDomain.callbacks!.signIn!({
        user: googleUser(),
        account,
        profile: { ...profile, hd: undefined },
      }),
    ).toBe(false)
  })

  it('stores the Google name on each new sign-in', async () => {
    for (const name of ['Member', 'Updated Member']) {
      expect(
        await config.callbacks!.signIn!({
          user: googleUser(),
          account,
          profile: { ...profile, name },
        }),
      ).toBe(true)
      expect(upsertPerson).toHaveBeenLastCalledWith(profile.email, name)
    }
    expect(upsertPerson).toHaveBeenCalledTimes(2)
  })

  it('redirects to a retryable error when Person persistence fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failure = new Error('Database unavailable')
    vi.mocked(upsertPerson).mockRejectedValueOnce(failure)
    const signingIn = googleUser()

    expect(await config.callbacks!.signIn!({ user: signingIn, account, profile })).toBe(
      '/auth/error?error=SignInUnavailable',
    )
    expect(signingIn.personId).toBeUndefined()
    expect(consoleError).toHaveBeenCalledWith('Failed to save Person during sign-in', failure)
    consoleError.mockRestore()
  })

  it.each([undefined, null, '', '   '])(
    'rejects unusable Google email %j before persistence',
    async (email) => {
      expect(
        await config.callbacks!.signIn!({
          user: googleUser(),
          account,
          profile: { ...profile, email },
        }),
      ).toBe(false)
      expect(upsertPerson).not.toHaveBeenCalled()
    },
  )

  it('issues the stored Person and drops provider tokens, profile data and provider identity from JWTs', async () => {
    const token = await config.callbacks!.jwt!({
      token: {
        ...validToken,
        sub: user.id,
        email: profile.email,
        name: user.name,
        picture: 'https://example.com/avatar.png',
        access_token: account.access_token,
        signedInAt: SIGNED_IN_AT - 28_800_000,
      },
      user: signedInUser,
      account,
      profile,
      trigger: 'signIn',
    })
    expect(token).toEqual(issuedToken)
    expect(upsertPerson).not.toHaveBeenCalled()
  })

  it('keeps the trusted email on client-triggered updates', async () => {
    vi.setSystemTime(SIGNED_IN_AT + 14_400_000)
    const token = await config.callbacks!.jwt!({
      token: {
        ...validToken,
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
    expect(token).toEqual(validToken)
    expect(upsertPerson).not.toHaveBeenCalled()
  })

  it('records server time on the initial sign-up callback', async () => {
    const token = await config.callbacks!.jwt!({
      token: { ...validToken, email: profile.email, signedInAt: SIGNED_IN_AT - 1_000 },
      user: signedInUser,
      account,
      profile,
      trigger: 'signUp',
    })
    expect(token).toEqual(issuedToken)
  })

  it.each([
    [0, true],
    [28_799_999, true],
    [28_800_000, false],
    [28_800_001, false],
  ])('enforces the absolute deadline at age %i milliseconds', async (age, valid) => {
    vi.setSystemTime(SIGNED_IN_AT + age)
    const token = await config.callbacks!.jwt!({
      token: validToken,
      user,
    })
    expect(token).toEqual(valid ? validToken : null)
  })

  it('preserves the original sign-in time across repeated session reads', async () => {
    let token: JWT = validToken
    for (const elapsed of [3_600_000, 14_400_000, 25_200_000]) {
      vi.setSystemTime(SIGNED_IN_AT + elapsed)
      const refreshed = await config.callbacks!.jwt!({ token, user })
      expect(refreshed).toEqual(validToken)
      token = refreshed!
    }
    vi.setSystemTime(SIGNED_IN_AT + 28_800_000)
    expect(await config.callbacks!.jwt!({ token, user })).toBeNull()
  })

  it('does not revive an expired session through a client update', async () => {
    vi.setSystemTime(SIGNED_IN_AT + 28_800_000)
    expect(
      await config.callbacks!.jwt!({
        token: validToken,
        user,
        trigger: 'update',
        session: { signedInAt: Date.now(), user: { email: 'member@example.com' } },
      }),
    ).toBeNull()
  })

  it.each([
    ['NaN', NaN],
    ['infinite', Infinity],
    ['negative', -1],
    ['fractional', SIGNED_IN_AT + 0.5],
    ['future', SIGNED_IN_AT + 1],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1],
  ])('rejects a %s sign-in timestamp', async (_label, signedInAt) => {
    expect(
      await config.callbacks!.jwt!({
        token: { ...validToken, signedInAt },
        user,
      }),
    ).toBeNull()
  })

  it.each(['', '   '])(
    'does not issue a token without a usable trusted email: %j',
    async (email) => {
      expect(await config.callbacks!.jwt!({ token: { ...validToken, email }, user })).toBeNull()
    },
  )

  it.each([
    ['without a stored Person', user],
    ['without an email', { ...signedInUser, email: undefined }],
    ['without a user', undefined],
  ])('does not issue a token on sign-in %s', async (_label, signInUser) => {
    expect(
      await config.callbacks!.jwt!({
        token: validToken,
        user: signInUser as typeof user,
        account,
        profile,
        trigger: 'signIn',
      }),
    ).toBeNull()
  })
})
