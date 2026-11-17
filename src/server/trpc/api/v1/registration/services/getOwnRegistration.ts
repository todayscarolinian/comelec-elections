import type { Db } from '@/server/trpc/init'
import { isRegistrationOpen } from './registrationWindow'

export async function getOwnRegistration(db: Db, personId: string) {
  const [registration, canSubmit] = await Promise.all([
    db.registration.findUnique({
      where: { personId },
      select: { status: true, yearLevel: true, rejectionReason: true },
    }),
    isRegistrationOpen(db),
  ])

  return { registration, canSubmit }
}
