import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAllowedGoogleProfile, normalizeEmail, normalizeHostedDomain } from './policy'

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
    session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
    pages: { error: '/auth/error' },
    callbacks: {
      async signIn({ profile }) {
        return isAllowedGoogleProfile(profile, domain)
      },
      jwt({ token, profile, trigger }) {
        const email = trigger === 'signIn' || trigger === 'signUp' ? profile?.email : token.email
        if (typeof email !== 'string' || !email.trim()) return null

        // Auth.js adds iat/exp/jti when encrypting. S1-03 adds the real Person id.
        return { email: normalizeEmail(email) }
      },
      session({ session, token }) {
        return { expires: session.expires, user: { email: token.email } }
      },
    },
  }
}
