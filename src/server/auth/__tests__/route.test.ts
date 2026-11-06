// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { encode } from 'next-auth/jwt'

// Only the React Server Components import marker is replaced; Auth.js runs normally.
vi.mock('server-only', () => ({}))

const BASE = 'http://localhost:3000'
const SECRET = 'test-only-auth-secret-at-least-thirty-two-characters'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('AUTH_URL', BASE)
  vi.stubEnv('AUTH_SECRET', SECRET)
  vi.stubEnv('AUTH_GOOGLE_ID', 'test-google-client')
  vi.stubEnv('AUTH_GOOGLE_SECRET', 'test-google-secret')
  vi.stubEnv('ALLOWED_HOSTED_DOMAIN', 'example.com')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('/api/auth routes', () => {
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

  it('sends the hosted-domain hint and account picker to Google without replacing OIDC protections', async () => {
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
    expect(destination.searchParams.get('hd')).toBe('example.com')
    expect(destination.searchParams.get('prompt')).toBe('select_account')
    expect(destination.searchParams.get('client_id')).toBe('test-google-client')
    expect(destination.searchParams.get('redirect_uri')).toBe(`${BASE}/api/auth/callback/google`)
    expect(destination.searchParams.get('code_challenge_method')).toBe('S256')
    expect(destination.searchParams.get('code_challenge')).toBeTruthy()
    expect(res.headers.get('set-cookie')).toContain('pkce.code_verifier=')
  })

  it('exposes only the normalized email and expiry from an encrypted JWT', async () => {
    const { GET } = await import('@/app/api/auth/[...nextauth]/route')
    const jwt = await encode({
      secret: SECRET,
      salt: 'authjs.session-token',
      token: {
        email: ' Member@Example.com ',
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
    expect(session).toEqual({ user: { email: 'member@example.com' }, expires: expect.any(String) })
    const remaining = new Date(session.expires).getTime() - Date.now()
    expect(remaining).toBeGreaterThan(28_790_000)
    expect(remaining).toBeLessThanOrEqual(28_800_000)
  })
})
