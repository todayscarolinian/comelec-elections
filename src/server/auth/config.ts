import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAllowedGoogleProfile, normalizeEmail, normalizeHostedDomain } from './policy'
import { upsertPerson } from './person'

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
      async jwt({ token, profile, trigger }) {
        const initialSignIn = trigger === 'signIn' || trigger === 'signUp'
        const now = Date.now()

        if (initialSignIn) {
          const email = profile?.email
          if (typeof email !== 'string' || !email.trim()) return null

          const person = await upsertPerson(email, profile?.name ?? normalizeEmail(email))

          return {
            personId: person.id,
            email: person.email,
            signedInAt: now,
          }
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
