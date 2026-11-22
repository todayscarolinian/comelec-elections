import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ELECTION } from '@/election'
import { validateBallot } from '@/server/trpc/api/v1/ballot/core/validateBallot'
import { createCallerFactory } from '@/server/trpc/init'
import { appRouter } from '@/server/trpc/root'
import { createAdmin, createVoter, db, resetDatabase } from './database'

vi.mock('@/server/auth', () => ({ auth: async () => null }))
vi.mock('@/lib/prisma', async () => ({ default: (await import('./database')).db }))
vi.mock('server-only', () => ({}))
vi.mock('next/server', () => ({ connection: async () => undefined, after: vi.fn() }))
vi.mock('next/cache', () => ({ cacheLife: () => undefined }))

const createCaller = createCallerFactory(appRouter)
const callerFor = (person: { id: string; email: string }) =>
  createCaller({
    db,
    headers: new Headers(),
    session: { user: { personId: person.id, email: person.email } },
  })

const ballot = validateBallot({
  disclosureAccepted: true,
  answers: Object.fromEntries(ELECTION.questions.map(({ id }) => [id, { abstain: true }])),
})

async function registrationOf(personId: string) {
  return db.registration.findUniqueOrThrow({
    where: { personId },
    select: { id: true, submittedAt: true },
  })
}

describe('notifications with PostgreSQL', () => {
  beforeEach(async () => {
    await resetDatabase()
    await db.electionState.create({ data: {} })
  })
  afterAll(() => db.$disconnect())

  it('sends a rejection only to the Applicant, with its reason', async () => {
    const admin = await createAdmin()
    const applicant = await createVoter('PENDING')
    const other = await createVoter('PENDING')

    await callerFor(admin).admin.rejectRegistration({
      ...(await registrationOf(applicant.id)),
      reason: 'Upload your current term profile',
    })

    const own = await callerFor(applicant).notification.list()
    expect(own.unreadCount).toBe(1)
    expect(own.items).toMatchObject([
      {
        type: 'REGISTRATION_REJECTED',
        data: { rejectionReason: 'Upload your current term profile' },
        read: false,
      },
    ])
    await expect(callerFor(other).notification.list()).resolves.toEqual({
      items: [],
      unreadCount: 0,
    })
  })

  it('broadcasts lifecycle changes once, with read state kept per Person', async () => {
    const admin = await createAdmin()
    const alice = await createVoter('APPROVED')
    const bob = await createVoter(null)

    await callerFor(admin).admin.setElectionStatus({ status: 'OPEN' })
    // A repeated toggle is a no-op and must not broadcast again.
    await callerFor(admin).admin.setElectionStatus({ status: 'OPEN' })
    expect(await db.notification.count()).toBe(1)

    for (const person of [alice, bob]) {
      const list = await callerFor(person).notification.list()
      expect(list.unreadCount).toBe(1)
      expect(list.items).toMatchObject([{ type: 'VOTING_OPENED', read: false }])
    }

    const [{ id }] = (await callerFor(alice).notification.list()).items
    await expect(callerFor(alice).notification.markRead({ ids: [id] })).resolves.toEqual({
      count: 1,
    })
    // Idempotent.
    await expect(callerFor(alice).notification.markRead({ ids: [id] })).resolves.toEqual({
      count: 0,
    })

    expect((await callerFor(alice).notification.list()).unreadCount).toBe(0)
    expect((await callerFor(bob).notification.list()).unreadCount).toBe(1)
  })

  it('cannot mark another Person’s notification read', async () => {
    const admin = await createAdmin()
    const applicant = await createVoter('PENDING')
    const intruder = await createVoter(null)
    await callerFor(admin).admin.approveRegistration(await registrationOf(applicant.id))
    const [{ id }] = (await callerFor(applicant).notification.list()).items

    await expect(callerFor(intruder).notification.markRead({ ids: [id] })).resolves.toEqual({
      count: 0,
    })
    expect(await db.notificationRead.count()).toBe(0)
  })

  it('shows broadcasts from before sign-up as already read', async () => {
    const admin = await createAdmin()
    await callerFor(admin).admin.setRegistrationStatus({ status: 'OPEN' })
    const late = await createVoter(null)

    const list = await callerFor(late).notification.list()
    expect(list.unreadCount).toBe(0)
    expect(list.items).toMatchObject([{ type: 'REGISTRATION_OPENED', read: true }])
  })

  it('records a ballot confirmation without choices, and nothing on a failed cast', async () => {
    const voter = await createVoter('APPROVED')
    await expect(callerFor(voter).ballot.cast(ballot)).rejects.toMatchObject({
      message: 'ElectionClosed',
    })
    expect(await db.notification.count()).toBe(0)

    await db.electionState.update({ where: { id: 'main' }, data: { electionStatus: 'OPEN' } })
    await callerFor(voter).ballot.cast(ballot)

    const stored = await db.notification.findMany()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({
      personId: voter.id,
      type: 'BALLOT_RECORDED',
      data: { held: false },
    })
  })

  it('marks all unread notifications read', async () => {
    const admin = await createAdmin()
    const voter = await createVoter('PENDING')
    await callerFor(admin).admin.setElectionStatus({ status: 'OPEN' })
    await callerFor(admin).admin.approveRegistration(await registrationOf(voter.id))
    expect((await callerFor(voter).notification.list()).unreadCount).toBe(2)

    await expect(callerFor(voter).notification.markAllRead()).resolves.toEqual({ count: 2 })
    expect((await callerFor(voter).notification.list()).unreadCount).toBe(0)
  })
})
