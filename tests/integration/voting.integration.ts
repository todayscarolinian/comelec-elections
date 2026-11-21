import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ELECTION } from '@/election'
import { validateBallot } from '@/server/trpc/api/v1/ballot/core/validateBallot'
import type { BallotInput } from '@/server/trpc/api/v1/ballot/schema'
import { createCallerFactory } from '@/server/trpc/init'
import { appRouter } from '@/server/trpc/root'
import { GET } from '@/app/api/turnout/route'
import { createAdmin, createVoter, db, resetDatabase } from './database'

vi.mock('@/server/auth', () => ({ auth: async () => null }))
vi.mock('@/lib/prisma', async () => ({ default: (await import('./database')).db }))
vi.mock('server-only', () => ({}))
// Next's request and cache scopes are unavailable when calling a handler directly.
// `after` callbacks (e.g. registration OCR) are post-response work with external dependencies; record them instead of running them.
vi.mock('next/server', () => ({ connection: async () => undefined, after: vi.fn() }))
vi.mock('next/cache', () => ({ cacheLife: () => undefined }))

const createCaller = createCallerFactory(appRouter)
const callerFor = (person: { id: string; email: string }) =>
  createCaller({
    db,
    headers: new Headers(),
    session: { user: { personId: person.id, email: person.email } },
  })

const expectedAnswers = ELECTION.questions.map((question, index) => ({
  questionId: question.id,
  candidateId: index === 0 ? question.candidates[0].id : null,
}))
// Parsed up front so an ELECTION change the fixture no longer satisfies fails here with a ZodError,
// instead of surfacing as InvalidBallot in every happy-path test.
const ballot: BallotInput = validateBallot({
  disclosureAccepted: true,
  answers: Object.fromEntries(
    expectedAnswers.map(({ questionId, candidateId }) => [
      questionId,
      candidateId ? { candidateIds: [candidateId] } : { abstain: true },
    ]),
  ),
})
const alreadyVoted = { code: 'CONFLICT', message: 'AlreadyVoted' }

async function expectStoredBallot(personId: string, held: boolean) {
  const stored = await db.ballot.findMany({
    where: { personId },
    include: { answers: { select: { questionId: true, candidateId: true } } },
  })
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    yearLevel: '2',
    disclosureAcceptedAt: expect.any(Date),
    heldAcknowledgedAt: held ? expect.any(Date) : null,
  })
  expect(stored[0].answers).toHaveLength(expectedAnswers.length)
  expect(stored[0].answers).toEqual(expect.arrayContaining(expectedAnswers))
}

async function expectNoBallot() {
  expect(await db.ballot.count()).toBe(0)
  expect(await db.ballotAnswer.count()).toBe(0)
}

describe('voting with PostgreSQL', () => {
  beforeEach(async () => {
    await resetDatabase()
    await db.electionState.create({ data: { electionStatus: 'OPEN' } })
  })
  afterAll(() => db.$disconnect())

  it('persists a complete ballot from an approved voter', async () => {
    const voter = await createVoter('APPROVED')
    await expect(callerFor(voter).ballot.cast(ballot)).resolves.toEqual({ ok: true, held: false })
    await expectStoredBallot(voter.id, false)
  })

  it('returns AlreadyVoted on the second cast', async () => {
    const voter = await createVoter('APPROVED')
    const caller = callerFor(voter)
    await caller.ballot.cast(ballot)
    await expect(caller.ballot.cast(ballot)).rejects.toMatchObject(alreadyVoted)
    await expectStoredBallot(voter.id, false)
  })

  it('persists exactly one complete ballot across eight concurrent casts', async () => {
    const voter = await createVoter('APPROVED')
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => callerFor(voter).ballot.cast(ballot)),
    )
    expect(results.filter((result) => result.status === 'fulfilled')).toEqual([
      { status: 'fulfilled', value: { ok: true, held: false } },
    ])
    const failures = results.filter((result) => result.status === 'rejected')
    expect(failures).toHaveLength(7)
    for (const failure of failures) expect(failure.reason).toMatchObject(alreadyVoted)
    await expectStoredBallot(voter.id, false)
  })

  it('rejects a cast while the election is closed without persisting a ballot', async () => {
    const voter = await createVoter('APPROVED')
    const admin = callerFor(await createAdmin())
    await admin.admin.setElectionStatus({ status: 'CLOSED' })
    await expect(callerFor(voter).ballot.cast(ballot)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'ElectionClosed',
    })
    await expectNoBallot()
  })

  it('does not let a voter cast again after close and reopen', async () => {
    const voter = await createVoter('APPROVED')
    const caller = callerFor(voter)
    const firstTimeVoter = await createVoter('APPROVED')
    const firstTimeCaller = callerFor(firstTimeVoter)
    const admin = callerFor(await createAdmin())
    await caller.ballot.cast(ballot)
    await admin.admin.setElectionStatus({ status: 'CLOSED' })
    await expect(firstTimeCaller.ballot.cast(ballot)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'ElectionClosed',
    })
    await admin.admin.setElectionStatus({ status: 'OPEN' })
    await expect(caller.ballot.cast(ballot)).rejects.toMatchObject(alreadyVoted)
    await expect(firstTimeCaller.ballot.cast(ballot)).resolves.toEqual({ ok: true, held: false })
    await expectStoredBallot(voter.id, false)
    await expectStoredBallot(firstTimeVoter.id, false)
  })

  it('rejects a signed-in person with no registration', async () => {
    const person = await createVoter(null)
    await expect(callerFor(person).ballot.cast(ballot)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'NotRegistered',
    })
    await expectNoBallot()
  })

  it.each(['PENDING', 'REJECTED'] as const)(
    'requires held acknowledgement for %s registration',
    async (status) => {
      const voter = await createVoter(status)
      await expect(callerFor(voter).ballot.cast(ballot)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'HeldNotAcknowledged',
      })
      await expectNoBallot()
    },
  )

  it.each(['PENDING', 'REJECTED'] as const)(
    'saves one acknowledged held ballot for %s registration',
    async (status) => {
      const voter = await createVoter(status)
      const caller = callerFor(voter)
      const input = { ...ballot, heldAcknowledged: true as const }
      await expect(caller.ballot.cast(input)).resolves.toEqual({ ok: true, held: true })
      await expect(caller.ballot.cast(input)).rejects.toMatchObject(alreadyVoted)
      await expectStoredBallot(voter.id, true)

      const admin = callerFor(await createAdmin())
      const results = await admin.results.get({ audience: 'admin' })
      expect(results).toMatchObject({
        countedBallots: 0,
        heldPending: status === 'PENDING' ? 1 : 0,
        heldRejected: status === 'REJECTED' ? 1 : 0,
      })
      expect(results.questions[0].candidates[0].votes).toBe(0)
    },
  )

  it('counts the original held ballot after admin approval, even after close', async () => {
    const voter = await createVoter('PENDING')
    const caller = callerFor(voter)
    await caller.ballot.cast({ ...ballot, heldAcknowledged: true })
    const admin = callerFor(await createAdmin())
    await admin.admin.setElectionStatus({ status: 'CLOSED' })
    const registration = await db.registration.findUniqueOrThrow({ where: { personId: voter.id } })
    await admin.admin.approveRegistration({
      id: registration.id,
      submittedAt: registration.submittedAt,
      yearLevel: '3',
    })
    const results = await admin.results.get({ audience: 'admin' })
    expect(results).toMatchObject({ countedBallots: 1, heldPending: 0, heldRejected: 0 })
    expect(results.questions[0].candidates[0].votes).toBe(1)
    expect(await db.ballot.findUnique({ where: { personId: voter.id } })).toMatchObject({
      yearLevel: '3',
    })
  })

  it('serves only aggregate turnout publicly, including held ballots', async () => {
    const approved = callerFor(await createVoter('APPROVED'))
    const held = callerFor(await createVoter('PENDING'))
    await createVoter('APPROVED')
    await createVoter('APPROVED')
    await approved.ballot.cast(ballot)
    await held.ballot.cast({ ...ballot, heldAcknowledged: true })

    const response = await GET()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      electionStatus: 'OPEN',
      ballotsCast: 2,
      approvedVoters: 3,
    })
  })
})
