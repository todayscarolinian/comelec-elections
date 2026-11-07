import 'server-only'
import NextAuth from 'next-auth'
import { createAuthConfig } from './config'
import { normalizeHostedDomain } from './policy'

export const allowedHostedDomain = normalizeHostedDomain(process.env.ALLOWED_HOSTED_DOMAIN)

export const { handlers, auth, signIn, signOut } = NextAuth(createAuthConfig(allowedHostedDomain))
