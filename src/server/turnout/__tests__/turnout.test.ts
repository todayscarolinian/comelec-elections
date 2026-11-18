// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { cacheLife, connection, findUnique, ballotCount, registrationCount, transaction } =
  vi.hoisted(() => {
    const findUnique = vi.fn()
    const ballotCount = vi.fn()
    const registrationCount = vi.fn()
    return {
      cacheLife: vi.fn(),
      connection: vi.fn(async () => undefined),
      findUnique,
      ballotCount,
      registrationCount,
      transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
    }
  })

// A strict fake: touching any model or method other than the three aggregate reads throws, so a
// query for Ballot rows, BallotAnswers (choices) or People fails the test instead of passing.
function strictDb() {
  const allowed: Record<string, Record<string, unknown>> = {
    electionState: { findUnique },
    ballot: { count: ballotCount },
    registration: { count: registrationCount },
  }
  return new Proxy(
    { $transaction: transaction },
    {
      get(target, prop: string) {
        if (prop === '$transaction') return target.$transaction
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
    expect(transaction).toHaveBeenCalledTimes(1)
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
  it('caches for 15 seconds and expires within the request-time window', async () => {
    await getCachedTurnout()

    expect(cacheLife).toHaveBeenCalledWith({
      stale: 15,
      revalidate: 15,
      expire: TURNOUT_EXPIRE_SECONDS,
    })
    expect(TURNOUT_REVALIDATE_SECONDS).toBe(15)
    // Under 5 minutes keeps it out of the build-time prerender (no DB access during `next build`).
    expect(TURNOUT_EXPIRE_SECONDS).toBeGreaterThan(TURNOUT_REVALIDATE_SECONDS)
    expect(TURNOUT_EXPIRE_SECONDS).toBeLessThan(300)
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
    // Server log keeps identifiers for debugging, not the message.
    expect(log).toHaveBeenCalledWith('Turnout query failed', {
      name: 'PrismaClientInitializationError',
      code: 'P1001',
      digest: '720153388',
    })
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/hunter2|db\.internal/)
    log.mockRestore()
  })
})
