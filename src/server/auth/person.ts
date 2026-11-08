import 'server-only'
import { normalizeEmail } from './policy'
import prisma from '@/lib/prisma'

export async function upsertPerson(email: string, name: string) {
  const normalizedEmail = normalizeEmail(email)

  return prisma.person.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, name },
    update: { name },
    select: { id: true, email: true },
  })
}
