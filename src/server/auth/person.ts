import 'server-only'
import { normalizeEmail } from './policy'
import prisma from '@/lib/prisma'

const MAX_NAME_LENGTH = 200

function normalizeName(name: string | null | undefined): string | undefined {
  return name?.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH).trim() || undefined
}

export async function upsertPerson(email: string, name: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email)
  const normalizedName = normalizeName(name)

  return prisma.person.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, name: normalizedName ?? normalizedEmail },
    update: normalizedName ? { name: normalizedName } : {},
    select: { id: true, email: true },
  })
}
