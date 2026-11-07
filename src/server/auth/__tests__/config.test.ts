// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createAuthConfig } from '../config'

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
      },
      user,
      account,
      profile,
      trigger: 'signIn',
    })
    expect(token).toEqual({ email: 'member@example.com' })
  })

  it('keeps the trusted email on client-triggered updates', async () => {
    const token = await config.callbacks!.jwt!({
      token: { email: 'member@example.com', iat: 100, exp: 200, jti: 'jwt-id' },
      user,
      trigger: 'update',
      session: {
        email: 'attacker@foreign.example',
        user: { email: 'attacker@foreign.example', personId: 'fake' },
      },
    })
    expect(token).toEqual({ email: 'member@example.com' })
  })

  it.each([undefined, null, '', '   '])(
    'does not issue a token without a usable trusted email: %j',
    async (email) => {
      expect(await config.callbacks!.jwt!({ token: { email }, user })).toBeNull()
    },
  )
})
