import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAllowedGoogleProfile, normalizeEmail, normalizeHostedDomain } from './policy'
import { upsertPerson } from './person'

const SESSION_MAX_AGE = 8 * 60 * 60
const SIGN_IN_UNAVAILABLE_URL = '/auth/error?error=SignInUnavailable'

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
      async signIn({ user, profile }) {
        if (!isAllowedGoogleProfile(profile, domain)) return false

        const email = profile?.email
        if (typeof email !== 'string' || !email.trim()) return false

        try {
          const person = await upsertPerson(email, profile?.name ?? normalizeEmail(email))
          user.personId = person.id
          user.email = person.email
        } catch (error) {
          console.error('Failed to save Person during sign-in', error)
          return SIGN_IN_UNAVAILABLE_URL
        }

        return true
      },
      async jwt({ token, user, trigger }) {
        const initialSignIn = trigger === 'signIn' || trigger === 'signUp'
        const now = Date.now()

        if (initialSignIn) {
          const personId = user?.personId
          const email = user?.email
          if (typeof personId !== 'string' || typeof email !== 'string') return null

          return { personId, email, signedInAt: now }
        }

        const { personId, email, signedInAt } = token

        if (
          typeof personId !== 'string' ||
          !personId.trim() ||
          typeof email !== 'string' ||
          !email.trim() ||
          typeof signedInAt !== 'number' ||
          !Number.isSafeInteger(signedInAt) ||
          signedInAt < 0 ||
          signedInAt > now ||
          now - signedInAt >= SESSION_MAX_AGE * 1000
        ) {
          return null
        }

        return {
          personId,
          email: normalizeEmail(email),
          signedInAt,
        }
      },
      session({ token }) {
        return {
          expires: new Date(token.signedInAt + SESSION_MAX_AGE * 1000).toISOString(),
          user: {
            personId: token.personId,
            email: token.email,
          },
        }
      },
    },
  }
}
