// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { cacheLife, connection, findUnique, ballotCount, registrationCount } = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  connection: vi.fn(async () => undefined),
  findUnique: vi.fn(),
  ballotCount: vi.fn(),
  registrationCount: vi.fn(),
}))

// A strict fake: touching any model or method other than the three aggregate reads throws, so a
// query for Ballot rows, BallotAnswers (choices) or People fails the test instead of passing.
function strictDb() {
  const allowed: Record<string, Record<string, unknown>> = {
    electionState: { findUnique },
    ballot: { count: ballotCount },
    registration: { count: registrationCount },
  }
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === 'then') return undefined
        const model = allowed[prop]
        if (!model) throw new Error(`Turnout must not touch db.${prop}`)
        return new Proxy(model, {
          get(methods, method: string) {
            if (!(method in methods)) throw new Error(`Turnout must not call ${prop}.${method}`)
            return methods[method]
          },
        })
      },
    },
  )
}

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife }))
vi.mock('next/server', () => ({ connection }))
vi.mock('@/lib/prisma', () => ({ default: strictDb() }))

import { GET } from '@/app/api/turnout/route'
import {
  getCachedTurnout,
  readTurnout,
  TURNOUT_EXPIRE_SECONDS,
  TURNOUT_REVALIDATE_SECONDS,
} from '@/server/turnout'

beforeEach(() => {
  vi.clearAllMocks()
  findUnique.mockResolvedValue({ electionStatus: 'OPEN' })
  ballotCount.mockResolvedValue(0)
  registrationCount.mockResolvedValue(0)
})

describe('readTurnout', () => {
  it('counts every Ballot, including Held Ballots, and only APPROVED Registrations', async () => {
    ballotCount.mockResolvedValue(42) // e.g. 37 counted + 5 Held Ballots
    registrationCount.mockResolvedValue(120)

    await expect(readTurnout(strictDb() as never)).resolves.toEqual({
      electionStatus: 'OPEN',
      ballotsCast: 42,
      approvedVoters: 120,
    })
    // No filter on Ballot: Held Ballots (pending or rejected Registrations) are included.
    expect(ballotCount).toHaveBeenCalledWith()
    expect(registrationCount).toHaveBeenCalledWith({ where: { status: 'APPROVED' } })
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'main' },
      select: { electionStatus: true },
    })
  })

  it('reports CLOSED when the ElectionState row does not exist yet', async () => {
    findUnique.mockResolvedValue(null)

    await expect(readTurnout(strictDb() as never)).resolves.toEqual({
      electionStatus: 'CLOSED',
      ballotsCast: 0,
      approvedVoters: 0,
    })
  })

  it('reports a CLOSED Election with its final counts', async () => {
    findUnique.mockResolvedValue({ electionStatus: 'CLOSED' })
    ballotCount.mockResolvedValue(7)
    registrationCount.mockResolvedValue(9)

    await expect(readTurnout(strictDb() as never)).resolves.toEqual({
      electionStatus: 'CLOSED',
      ballotsCast: 7,
      approvedVoters: 9,
    })
  })
})

describe('getCachedTurnout', () => {
  // `next/cache` is mocked and `'use cache: remote'` is a plain string under vitest, so these tests
  // pin the configuration only. Shared caching itself was verified against `next build` +
  // `next start` (see PR #50).
  it('passes cacheLife a 15s revalidate and a hard expiry just above it', async () => {
    await getCachedTurnout()

    expect(cacheLife).toHaveBeenCalledWith({ revalidate: 15, expire: 16 })
    expect(TURNOUT_REVALIDATE_SECONDS).toBe(15)
    expect(TURNOUT_EXPIRE_SECONDS).toBe(16)
  })

  it('keeps the shared remote cache directive as the first statement', () => {
    // Guards against dropping the directive or switching to per-instance `'use cache'`.
    const source = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8')
    expect(source).toMatch(
      /export async function getCachedTurnout\(\): Promise<Turnout> \{\s*'use cache: remote'\n/,
    )
  })
})

describe('GET /api/turnout', () => {
  it('returns exactly electionStatus, ballotsCast and approvedVoters', async () => {
    // Even if a row ever came back with extra columns, they must not reach the response.
    findUnique.mockResolvedValue({ electionStatus: 'OPEN', resultsReleasedAt: null, id: 'main' })
    ballotCount.mockResolvedValue(3)
    registrationCount.mockResolvedValue(5)

    const res = await GET()

    expect(res.status).toBe(200)
    expect(connection).toHaveBeenCalledTimes(1)
    const body = await res.json()
    expect(Object.keys(body).sort()).toEqual(['approvedVoters', 'ballotsCast', 'electionStatus'])
    expect(body).toEqual({ electionStatus: 'OPEN', ballotsCast: 3, approvedVoters: 5 })
  })

  it('serves CLOSED with zero counts when no Election state exists', async () => {
    findUnique.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      electionStatus: 'CLOSED',
      ballotsCast: 0,
      approvedVoters: 0,
    })
  })

  it('returns a generic, uncached 503 when the database fails, without leaking details', async () => {
    const error = Object.assign(
      new Error('connect ECONNREFUSED db.internal:5432 password=hunter2 SELECT "Ballot"'),
      { name: 'PrismaClientInitializationError', code: 'P1001', digest: '720153388' },
    )
    ballotCount.mockRejectedValue(error)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await GET()

    expect(res.status).toBe(503)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ error: 'Turnout is temporarily unavailable.' })
    expect(text).not.toMatch(/ECONNREFUSED|db\.internal|hunter2|Ballot|P1001|Prisma/)
    // Prisma identifiers are logged inside the cached function, before the cache boundary would
    // drop them; the route logs the digest. Never the message.
    expect(log).toHaveBeenCalledWith('Turnout query failed', {
      name: 'PrismaClientInitializationError',
      code: 'P1001',
    })
    expect(log).toHaveBeenCalledWith('Turnout request failed', { digest: '720153388' })
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/hunter2|db\.internal/)
    log.mockRestore()
  })
})
