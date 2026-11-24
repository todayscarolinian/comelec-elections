'use client'

import { useQuery } from '@tanstack/react-query'
import type { Turnout } from '@/server/turnout'

/** Matches the route's shared cache window (Design §7.1); polling faster only re-reads the cache. */
const TURNOUT_POLL_MS = 15_000

const formatCount = (count: number) => count.toLocaleString('en-US')

async function fetchTurnout(): Promise<Turnout> {
  const response = await fetch('/api/turnout', { cache: 'no-store' })
  if (!response.ok) throw new Error(`Turnout request failed with ${response.status}`)
  return (await response.json()) as Turnout
}

export function TurnoutCount() {
  const { data, isPending } = useQuery({
    queryKey: ['turnout'],
    queryFn: fetchTurnout,
    refetchInterval: TURNOUT_POLL_MS,
    staleTime: TURNOUT_POLL_MS,
  })

  // A failed refresh keeps showing the last good snapshot; only no data at all is "unavailable".
  let figure = '—'
  let caption = isPending ? 'Loading turnout…' : 'Live turnout is unavailable.'
  let detail: string | undefined
  if (data) {
    figure = formatCount(data.ballotsCast)
    caption = data.ballotsCast === 1 ? 'Ballot cast' : 'Ballots cast'
    detail = `${formatCount(data.approvedVoters)} approved ${data.approvedVoters === 1 ? 'Voter' : 'Voters'} · ${
      data.electionStatus === 'OPEN' ? 'Voting is open' : 'Voting is closed'
    }`
  }

  return (
    <div
      className="grid flex-1 content-center justify-items-center py-8 text-center"
      aria-live="polite"
      aria-busy={isPending}
    >
      <span className="text-[clamp(6rem,min(20vw,32svh),18rem)] leading-none italic [font-family:var(--landing-fraunces),Georgia,serif]">
        {figure}
      </span>
      <p className="text-[0.8rem] tracking-[0.12em] uppercase">{caption}</p>
      {detail && <p className="mt-2 text-[0.8rem]">{detail}</p>}
    </div>
  )
}
