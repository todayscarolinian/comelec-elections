import { randomUUID } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type RegistrationStatus } from '@/generated/prisma/client'
import { testDatabaseUrl } from './database-url'

export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: testDatabaseUrl, max: 10 }),
})

export async function resetDatabase() {
  await db.$executeRaw`TRUNCATE TABLE "BallotAnswer", "Ballot", "Registration", "Person", "Admin", "AuditLog", "ElectionState"`
}

async function createPerson() {
  return db.person.create({ data: { name: 'Test User', email: `${randomUUID()}@example.test` } })
}

export async function createVoter(status: RegistrationStatus | null) {
  const person = await createPerson()
  if (status) {
    await db.registration.create({
      data: {
        personId: person.id,
        status,
        yearLevel: '2',
        studentProfilePath: `${person.id}/profile.pdf`,
      },
    })
  }
  return person
}

export async function createAdmin() {
  const person = await createPerson()
  await db.admin.create({ data: { email: person.email, grantedBy: 'seed' } })
  return person
}
