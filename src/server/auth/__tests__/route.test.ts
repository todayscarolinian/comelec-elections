// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { decode, encode } from 'next-auth/jwt'

// Only the React Server Components import marker is replaced; Auth.js runs normally.
vi.mock('server-only', () => ({}))
vi.mock('../person', () => ({
  upsertPerson: vi.fn(() => {
    throw new Error('Session reads must not persist Person')
  }),
}))

const BASE = 'http://localhost:3000'
const SECRET = 'test-only-auth-secret-at-least-thirty-two-characters'
const SIGNED_IN_AT = Date.parse('2026-11-07T00:00:00.000Z')
const identity = { personId: 'test-person-id', email: 'member@example.com' }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(SIGNED_IN_AT)
  vi.resetModules()
  vi.stubEnv('AUTH_URL', BASE)
  vi.stubEnv('AUTH_SECRET', SECRET)
  vi.stubEnv('AUTH_GOOGLE_ID', 'test-google-client')
  vi.stubEnv('AUTH_GOOGLE_SECRET', 'test-google-secret')
  vi.stubEnv('ALLOWED_HOSTED_DOMAIN', 'example.com')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('/api/auth routes', () => {
  it.each([
    [' ExAmPlE.CoM ', 'example.com'],
    ['   ', undefined],
    [undefined, undefined],
  ])('exports the normalized configured domain for %j', async (domain, expected) => {
    vi.stubEnv('ALLOWED_HOSTED_DOMAIN', domain)
    const auth = await import('@/server/auth')
    expect(auth).toHaveProperty('allowedHostedDomain', expected)
  })

  it('exposes Google as the only sign-in provider', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const res = await GET(new NextRequest(`${BASE}/api/auth/providers`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oidc',
        signinUrl: `${BASE}/api/auth/signin/google`,
        callbackUrl: `${BASE}/api/auth/callback/google`,
      },
    })
  })

  it('provides a CSRF token and cookie for the built-in sign-in flow', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const res = await GET(new NextRequest(`${BASE}/api/auth/csrf`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ csrfToken: expect.any(String) })
    expect(res.headers.get('set-cookie')).toContain('authjs.csrf-token=')
  })

  it('returns no session for a signed-out visitor', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const res = await GET(new NextRequest(`${BASE}/api/auth/session`))
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('rejects POST sign-in without a CSRF token', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await import('@/app/api/auth/[...nextauth]/route')
    const res = await POST(
      new NextRequest(`${BASE}/api/auth/signin/google`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: '',
      }),
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${BASE}/api/auth/signin?error=MissingCSRF`)
    expect(res.headers.get('set-cookie') ?? '').not.toContain('authjs.session-token=')
  })

  it.each([
    ['example.com', 'example.com'],
    [' ExAmPlE.CoM ', 'example.com'],
    ['   ', null],
    [undefined, null],
  ])(
    'normalizes the hosted-domain hint %j without replacing OIDC protections',
    async (domain, expectedHint) => {
      vi.stubEnv('ALLOWED_HOSTED_DOMAIN', domain)
      vi.stubGlobal('fetch', async (input: URL | Request | string) => {
        if (String(input) !== 'https://accounts.google.com/.well-known/openid-configuration') {
          throw new Error('Unexpected external request in auth test')
        }
        return Response.json({
          issuer: 'https://accounts.google.com',
          authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
          token_endpoint: 'https://oauth2.googleapis.com/token',
          jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
        })
      })
      const { GET, POST } = await import('@/app/api/auth/[...nextauth]/route')
      const csrfRes = await GET(new NextRequest(`${BASE}/api/auth/csrf`))
      const { csrfToken } = await csrfRes.json()
      const cookie = csrfRes.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ')
      const res = await POST(
        new NextRequest(`${BASE}/api/auth/signin/google`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
          body: new URLSearchParams({ csrfToken, callbackUrl: BASE }),
        }),
      )
      expect(res.status).toBe(302)
      const destination = new URL(res.headers.get('location')!)
      expect(destination.origin).toBe('https://accounts.google.com')
      expect(destination.searchParams.get('hd')).toBe(expectedHint)
      expect(destination.searchParams.get('prompt')).toBe('select_account')
      expect(destination.searchParams.get('client_id')).toBe('test-google-client')
      expect(destination.searchParams.get('redirect_uri')).toBe(`${BASE}/api/auth/callback/google`)
      expect(destination.searchParams.get('code_challenge_method')).toBe('S256')
      expect(destination.searchParams.get('code_challenge')).toBeTruthy()
      expect(res.headers.get('set-cookie')).toContain('pkce.code_verifier=')
    },
  )

  it('exposes only Person identity and expiry and strips provider data from refreshed cookies', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const jwt = await encode({
      secret: SECRET,
      salt: 'authjs.session-token',
      maxAge: 28_800,
      token: {
        personId: identity.personId,
        email: identity.email,
        signedInAt: SIGNED_IN_AT,
        sub: 'google-subject',
        name: 'Member',
        picture: 'https://example.com/avatar.png',
        access_token: 'private-access-token',
        refresh_token: 'private-refresh-token',
        id_token: 'private-id-token',
      },
    })
    const res = await GET(
      new NextRequest(`${BASE}/api/auth/session`, {
        headers: { cookie: `authjs.session-token=${jwt}` },
      }),
    )
    expect(res.status).toBe(200)
    const session = await res.json()
    expect(session).toEqual({
      user: identity,
      expires: '2026-11-07T08:00:00.000Z',
    })
    const refreshedCookie = res.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith('authjs.session-token='))
    expect(refreshedCookie).toBeDefined()
    const refreshed = await decode({
      secret: SECRET,
      salt: 'authjs.session-token',
      token: refreshedCookie!.split(';')[0].slice('authjs.session-token='.length),
    })
    expect(refreshed).toEqual({
      ...identity,
      signedInAt: SIGNED_IN_AT,
      iat: expect.any(Number),
      exp: expect.any(Number),
      jti: expect.any(String),
    })
  })

  it('reports the original deadline instead of extending public expiry on a session read', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const jwt = await encode({
      secret: SECRET,
      salt: 'authjs.session-token',
      maxAge: 28_800,
      token: { ...identity, signedInAt: SIGNED_IN_AT },
    })
    vi.setSystemTime(SIGNED_IN_AT + 25_200_000)
    const res = await GET(
      new NextRequest(`${BASE}/api/auth/session`, {
        headers: { cookie: `authjs.session-token=${jwt}` },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      user: identity,
      expires: '2026-11-07T08:00:00.000Z',
    })
  })

  it('rejects and clears a repeatedly refreshed cookie at the absolute deadline', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const jwt = await encode({
      secret: SECRET,
      salt: 'authjs.session-token',
      maxAge: 28_800,
      token: { ...identity, signedInAt: SIGNED_IN_AT },
    })
    let cookie = `authjs.session-token=${jwt}`
    for (const elapsed of [3_600_000, 14_400_000, 25_200_000]) {
      vi.setSystemTime(SIGNED_IN_AT + elapsed)
      const res = await GET(new NextRequest(`${BASE}/api/auth/session`, { headers: { cookie } }))
      expect(res.status).toBe(200)
      expect((await res.json()).user).toEqual(identity)
      cookie = res.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ')
      expect(cookie).toContain('authjs.session-token=')
    }
    vi.setSystemTime(SIGNED_IN_AT + 28_800_000)
    const res = await GET(new NextRequest(`${BASE}/api/auth/session`, { headers: { cookie } }))
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
    expect(res.headers.get('set-cookie')).toContain('authjs.session-token=;')
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it('requires fresh sign-in for legacy cookies without a sign-in timestamp', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const jwt = await encode({
      secret: SECRET,
      salt: 'authjs.session-token',
      maxAge: 28_800,
      token: identity,
    })
    const res = await GET(
      new NextRequest(`${BASE}/api/auth/session`, {
        headers: { cookie: `authjs.session-token=${jwt}` },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it.each([
    { signedInAt: undefined },
    { signedInAt: null },
    { signedInAt: String(SIGNED_IN_AT) },
    { email: undefined },
    { email: null },
    { personId: undefined },
    { personId: null },
    { personId: 123 },
  ])('rejects and clears malformed identity or expiry metadata: %j', async (invalidFields) => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const jwt = await encode({
      secret: SECRET,
      salt: 'authjs.session-token',
      maxAge: 28_800,
      token: { ...identity, signedInAt: SIGNED_IN_AT, ...invalidFields },
    })
    const res = await GET(
      new NextRequest(`${BASE}/api/auth/session`, {
        headers: { cookie: `authjs.session-token=${jwt}` },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})
