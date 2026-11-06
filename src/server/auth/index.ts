import 'server-only'
import NextAuth from 'next-auth'
import { createAuthConfig } from './config'

export const { handlers, auth, signIn, signOut } = NextAuth(
  createAuthConfig(process.env.ALLOWED_HOSTED_DOMAIN),
)
