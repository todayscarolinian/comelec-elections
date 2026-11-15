import type { Db } from '@/server/trpc/init'

type WindowStatus = 'OPEN' | 'CLOSED'

export async function setRegistrationStatus(db: Db, status: WindowStatus) {
  return db.electionState.upsert({
    where: { id: 'main' },
    update: { registrationStatus: status },
    create: { id: 'main', registrationStatus: status },
    select: { registrationStatus: true },
  })
}

export async function getRegistrationWindow(db: Db) {
  const [state, pendingCount] = await db.$transaction([
    db.electionState.findUnique({
      where: { id: 'main' },
      select: { registrationStatus: true },
    }),
    db.registration.count({ where: { status: 'PENDING' } }),
  ])

  return { registrationStatus: state?.registrationStatus ?? 'CLOSED', pendingCount }
}
