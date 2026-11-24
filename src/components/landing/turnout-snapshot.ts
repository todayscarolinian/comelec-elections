import { z } from 'zod'

export const TURNOUT_REFRESH_MS = 60_000
export const TURNOUT_STORAGE_KEY = 'turnout-snapshot:v1'
const MAX_GROWTH_STEPS = 60

const countSchema = z.number().int().nonnegative()
const turnoutSchema = z.object({
  ballotsCast: countSchema,
  approvedVoters: countSchema,
  electionStatus: z.enum(['OPEN', 'CLOSED']),
})
const snapshotSchema = turnoutSchema.extend({
  receivedAt: countSchema,
  growth: z
    .object({ from: countSchema, offsets: z.array(countSchema).max(MAX_GROWTH_STEPS) })
    .optional(),
})

export type TurnoutSnapshot = z.infer<typeof snapshotSchema>

export function readTurnoutSnapshot(): TurnoutSnapshot | undefined {
  try {
    const stored = window.localStorage.getItem(TURNOUT_STORAGE_KEY)
    if (stored) {
      const { data } = snapshotSchema.safeParse(JSON.parse(stored))
      if (data && data.receivedAt <= Date.now()) return data
    }
  } catch {
    // Storage may be blocked or contain data left by a previous visit.
  }
}

export async function fetchTurnout(previous?: TurnoutSnapshot): Promise<TurnoutSnapshot> {
  const cached = readTurnoutSnapshot()
  if (cached && (!previous || cached.receivedAt >= previous.receivedAt)) previous = cached
  if (previous && Date.now() - previous.receivedAt < TURNOUT_REFRESH_MS) return previous

  const response = await fetch('/api/turnout', { cache: 'no-store' })
  if (!response.ok) throw new Error(`Turnout request failed with ${response.status}`)
  const turnout = turnoutSchema.parse(await response.json())

  // Another tab may have saved its response while this request was in flight.
  const refreshed = readTurnoutSnapshot()
  if (refreshed && refreshed.receivedAt > (previous?.receivedAt ?? -1)) return refreshed

  const snapshot: TurnoutSnapshot = { ...turnout, receivedAt: Date.now() }
  if (previous && turnout.ballotsCast > previous.ballotsCast) {
    const steps = Math.min(turnout.ballotsCast - previous.ballotsCast, MAX_GROWTH_STEPS)
    const slot = TURNOUT_REFRESH_MS / steps
    snapshot.growth = {
      from: previous.ballotsCast,
      // Jitter within each slot keeps updates irregular and leaves room for each slide.
      offsets: Array.from({ length: steps }, (_, index) =>
        index === steps - 1
          ? TURNOUT_REFRESH_MS
          : Math.round((index + 0.2 + Math.random() * 0.6) * slot),
      ),
    }
  }

  try {
    window.localStorage.setItem(TURNOUT_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // React Query keeps an in-memory copy when browser storage is unavailable.
  }
  return snapshot
}

export function turnoutAt(snapshot: TurnoutSnapshot, now: number, reducedMotion: boolean) {
  const { ballotsCast, growth, receivedAt } = snapshot
  if (!growth || reducedMotion) return { count: ballotsCast, nextUpdateIn: undefined }

  const elapsed = now - receivedAt
  const next = growth.offsets.findIndex((offset) => offset > elapsed)
  if (next === -1) return { count: ballotsCast, nextUpdateIn: undefined }

  return {
    count: growth.from + Math.floor(((ballotsCast - growth.from) * next) / growth.offsets.length),
    nextUpdateIn: growth.offsets[next] - elapsed,
  }
}
