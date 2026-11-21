import 'server-only'

import { cacheLife } from 'next/cache'
import type { PrismaClient, WindowStatus } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'

/** Seconds a Turnout snapshot is shared by every visitor before it is refreshed (Design §7.1). */
export const TURNOUT_REVALIDATE_SECONDS = 15

/**
 * Hard limit on a snapshot's age. Just above `revalidate`, so a stale snapshot is only served
 * during a 1-second window; after that the next visitor waits for a fresh read. Visitors never get
 * Turnout more than ~16 seconds old, even after a quiet period.
 */
export const TURNOUT_EXPIRE_SECONDS = TURNOUT_REVALIDATE_SECONDS + 1

export type Turnout = {
  electionStatus: WindowStatus
  ballotsCast: number
  approvedVoters: number
}

type TurnoutDb = Pick<PrismaClient, 'electionState' | 'ballot' | 'registration'>

/**
 * Aggregate counts only (ADR 0005). Never reads BallotAnswer, Ballot rows or anything personal.
 * `ballotsCast` includes Held Ballots (ADR 0008); `approvedVoters` counts APPROVED Registrations.
 * The reads run in parallel and are not one snapshot: a Ballot cast between them can skew the two
 * counts by a vote, which the next refresh corrects.
 */
export async function readTurnout(db: TurnoutDb): Promise<Turnout> {
  const [state, ballotsCast, approvedVoters] = await Promise.all([
    db.electionState.findUnique({ where: { id: 'main' }, select: { electionStatus: true } }),
    db.ballot.count(),
    db.registration.count({ where: { status: 'APPROVED' } }),
  ])

  return {
    // No migration seeds the main row yet; a missing row means nothing has been opened.
    electionStatus: state?.electionStatus ?? 'CLOSED',
    ballotsCast,
    approvedVoters,
  }
}

/**
 * Turnout shared by every visitor. `use cache: remote` stores the entry in the platform's shared
 * cache (Vercel Runtime Cache), so all function instances reuse one snapshot; self-hosted it falls
 * back to the per-process in-memory cache. `expire` under 5 minutes keeps it out of the build-time
 * prerender, so the database is only queried at request time. Errors are not cached.
 */
export async function getCachedTurnout(): Promise<Turnout> {
  'use cache: remote'
  cacheLife({ revalidate: TURNOUT_REVALIDATE_SECONDS, expire: TURNOUT_EXPIRE_SECONDS })

  try {
    return await readTurnout(prisma)
  } catch (error) {
    // Log here, inside the cache boundary: errors that cross it are serialized and lose fields
    // such as Prisma's `code` and class `name`. Identifiers only, never the message.
    const { name, code } = (error ?? {}) as { name?: string; code?: string }
    console.error('Turnout query failed', { name, code })
    throw error
  }
}
