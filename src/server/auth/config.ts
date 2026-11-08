import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAllowedGoogleProfile, normalizeEmail, normalizeHostedDomain } from './policy'

const SESSION_MAX_AGE = 8 * 60 * 60

export function createAuthConfig(allowedDomain: string | undefined): NextAuthConfig {
  const domain = normalizeHostedDomain(allowedDomain)
  return {
    providers: [
      Google({
        authorization: {
          params: {
            prompt: 'select_account',
            ...(domain ? { hd: domain } : {}),
          },
        },
      }),
    ],
    session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
    pages: { error: '/auth/error' },
    callbacks: {
      async signIn({ profile }) {
        return isAllowedGoogleProfile(profile, domain)
      },
      jwt({ token, profile, trigger }) {
        const initialSignIn = trigger === 'signIn' || trigger === 'signUp'
        const email = initialSignIn ? profile?.email : token.email
        if (typeof email !== 'string' || !email.trim()) return null

        const now = Date.now()
        const signedInAt = initialSignIn ? now : token.signedInAt
        if (
          typeof signedInAt !== 'number' ||
          !Number.isSafeInteger(signedInAt) ||
          signedInAt < 0 ||
          signedInAt > now ||
          now - signedInAt >= SESSION_MAX_AGE * 1000
        )
          return null

        // Auth.js renews iat/exp on refresh; signedInAt keeps the absolute deadline.
        // Keep only identity and server-issued expiry metadata. S1-03 adds Person id.
        return { email: normalizeEmail(email), signedInAt }
      },
      session({ token }) {
        if (typeof token.signedInAt !== 'number') throw new Error('Missing session sign-in time')
        return {
          expires: new Date(token.signedInAt + SESSION_MAX_AGE * 1000).toISOString(),
          user: { email: token.email },
        }
      },
    },
  }
}
