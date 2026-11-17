// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { database, auth } = vi.hoisted(() => ({ database: {}, auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ default: database }))
vi.mock('@/server/auth', () => ({ auth }))
vi.mock('@/server/storage', () => ({ getSupabaseAdmin: vi.fn() }))

import { POST } from '@/app/api/trpc/[trpc]/route'
import { session, setup, validBallot } from './castHelpers'

const origin = 'http://localhost:3000'
const sentinel = 'PRIVATE-BALLOT-SENTINEL'

function request(input: unknown) {
  return rawRequest(JSON.stringify({ json: input }))
}

function rawRequest(body: string, path = 'ballot.cast') {
  return POST(
    new Request(`${origin}/api/trpc/${path}`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body,
    }),
  )
}

beforeEach(() => {
  vi.stubEnv('AUTH_URL', origin)
  auth.mockResolvedValue(session)
  for (const method of ['log', 'error', 'warn', 'info', 'debug'] as const) {
    vi.spyOn(console, method).mockImplementation(() => {})
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function expectNoLogs() {
  for (const method of ['log', 'error', 'warn', 'info', 'debug'] as const) {
    expect(console[method]).not.toHaveBeenCalled()
  }
}

describe('ballot.cast transport privacy', () => {
  it('returns only ok after a successful cast', async () => {
    const { db } = setup()
    Object.assign(database, db)
    const response = await request(validBallot())
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ result: { data: { json: { ok: true } } } })
    expectNoLogs()
  })

  it.each([
    { ...validBallot(), [sentinel]: 'private extra field' },
    { ...validBallot(), answers: { ...validBallot().answers, [sentinel]: { abstain: true } } },
    {
      ...validBallot(),
      answers: { ...validBallot().answers, 'placeholder-question-1': { candidateIds: [sentinel] } },
    },
    {
      ...validBallot(),
      answers: { ...validBallot().answers, 'placeholder-question-1': { [sentinel]: true } },
    },
    { ...validBallot(), disclosureAccepted: sentinel },
  ])('redacts invalid input %# from HTTP errors and logs', async (input) => {
    const { db } = setup()
    Object.assign(database, db)
    const response = await request(input)
    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toContain('InvalidBallot')
    expect(text).not.toContain(sentinel)
    expect(text).not.toContain('candidateIds')
    expect(text).not.toContain('placeholder-question-2-candidate-d')
    expectNoLogs()
  })

  it.each(['lock', 'registration', 'ballot', 'answers', 'commit'] as const)(
    'redacts raw %s failures from HTTP errors and logs',
    async (stage) => {
      const { db, tx } = setup()
      const error = new Error(`${sentinel}: ${JSON.stringify(validBallot())}`)
      const operation = {
        lock: tx.$queryRaw,
        registration: tx.registration.findUnique,
        ballot: tx.ballot.create,
        answers: tx.ballotAnswer.createMany,
        commit: db.$transaction,
      }[stage]
      operation.mockRejectedValueOnce(error)
      Object.assign(database, db)
      const response = await request(validBallot())
      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toContain('Unable to cast Ballot.')
      expect(text).not.toContain(sentinel)
      expect(text).not.toContain('candidateIds')
      expect(text).not.toContain('placeholder-question-2-candidate-d')
      expectNoLogs()
    },
  )

  it.each([
    ['malformed JSON', `{"json":{"answers":{"candidateIds":[${sentinel}]}}}`],
    [
      'invalid SuperJSON metadata',
      JSON.stringify({
        json: validBallot(),
        meta: { values: { 'answers.placeholder-question-2.candidateIds.0': ['bigint'] }, v: 1 },
      }),
    ],
  ])('redacts %s decoding errors before the resolver', async (_, body) => {
    const { db } = setup()
    Object.assign(database, db)
    const response = await rawRequest(body)
    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toContain('InvalidBallot')
    expect(text).not.toContain('candidateIds')
    expect(text).not.toContain('PRIVATE-')
    expect(text).not.toContain('placeholder-question-2-candidate-d')
    expect(db.$transaction).not.toHaveBeenCalled()
    expectNoLogs()
  })

  it.each([
    ['malformed JSON', `{"0":{"json":{"answers":{"candidateIds":[${sentinel}]}}},"1":{"json":{}}}`],
    [
      'invalid SuperJSON metadata',
      JSON.stringify({
        0: {
          json: validBallot(),
          meta: { values: { 'answers.placeholder-question-2.candidateIds.0': ['bigint'] }, v: 1 },
        },
        1: { json: { yearLevel: '2', studentProfilePath: 'person-1/profile' } },
      }),
    ],
  ])('redacts shared %s errors from every response in a mixed batch', async (_, body) => {
    const { db } = setup()
    Object.assign(database, db)
    const response = await rawRequest(body, 'ballot.cast,registration.submit?batch=1')
    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toContain('InvalidBallot')
    expect(text).not.toContain('candidateIds')
    expect(text).not.toContain('PRIVATE-')
    expect(text).not.toContain('placeholder-question-2-candidate-d')
    expect(db.$transaction).not.toHaveBeenCalled()
    expectNoLogs()
  })
})
