import 'server-only'

import { cacheLife } from 'next/cache'
import type { PrismaClient } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'

/** Seconds a Turnout snapshot is shared by every visitor before it is refreshed (Design §7.1). */
export const TURNOUT_REVALIDATE_SECONDS = 15

/** Upper bound on how old a snapshot can get when nobody polls for a while. */
export const TURNOUT_EXPIRE_SECONDS = 60

export type Turnout = {
  electionStatus: 'OPEN' | 'CLOSED'
  ballotsCast: number
  approvedVoters: number
}

type TurnoutDb = Pick<PrismaClient, '$transaction' | 'electionState' | 'ballot' | 'registration'>

/**
 * Aggregate counts only (ADR 0005). Never reads BallotAnswer, Ballot rows or anything personal.
 * `ballotsCast` includes Held Ballots (ADR 0008); `approvedVoters` counts APPROVED Registrations.
 */
export async function readTurnout(db: TurnoutDb): Promise<Turnout> {
  const [state, ballotsCast, approvedVoters] = await db.$transaction([
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
  cacheLife({
    stale: TURNOUT_REVALIDATE_SECONDS,
    revalidate: TURNOUT_REVALIDATE_SECONDS,
    expire: TURNOUT_EXPIRE_SECONDS,
  })

  return readTurnout(prisma)
}
