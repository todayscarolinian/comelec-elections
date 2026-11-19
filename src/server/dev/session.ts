import 'server-only'
import { z } from 'zod'
import { upsertPerson } from '@/server/auth/person'
import { normalizeEmail } from '@/server/auth/policy'
import type { Session } from '@/server/trpc/init'

export const DEV_EMAIL_HEADER = 'x-dev-email'
export const DEV_NAME_HEADER = 'x-dev-name'

const devEmailSchema = z.email()

export function isDevEnvironment() {
  return process.env.NODE_ENV === 'development'
}

export function parseDevEmail(value: string | null): string | null {
  const parsed = devEmailSchema.safeParse(value?.trim())
  return parsed.success ? normalizeEmail(parsed.data) : null
}

export async function createDevSession(headers: Headers): Promise<Session> {
  const email = parseDevEmail(headers.get(DEV_EMAIL_HEADER))
  if (!email) return null

  const person = await upsertPerson(email, decodeDevName(headers.get(DEV_NAME_HEADER)))
  return { user: { personId: person.id, email: person.email } }
}

function decodeDevName(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}
