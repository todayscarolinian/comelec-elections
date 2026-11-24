'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  fetchTurnout,
  readTurnoutSnapshot,
  turnoutAt,
  TURNOUT_REFRESH_MS,
  TURNOUT_STORAGE_KEY,
  type TurnoutSnapshot,
} from './turnout-snapshot'

const turnoutKey = ['turnout'] as const
const formatCount = (count: number) => count.toLocaleString('en-US')

function useTurnoutFrame(snapshot: TurnoutSnapshot | undefined) {
  const [frame, setFrame] = useState<{ count: number; previous?: number }>()

  useEffect(() => {
    if (!snapshot) return
    const currentSnapshot = snapshot
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let timer: number | undefined

    function update() {
      window.clearTimeout(timer)
      const { count, nextUpdateIn } = turnoutAt(
        currentSnapshot,
        Date.now(),
        motion?.matches ?? false,
      )
      setFrame((last) => {
        if (last?.count === count) return last
        return { count, previous: motion?.matches ? undefined : last?.count }
      })
      if (nextUpdateIn !== undefined) timer = window.setTimeout(update, nextUpdateIn)
    }

    update()
    motion?.addEventListener('change', update)
    return () => {
      window.clearTimeout(timer)
      motion?.removeEventListener('change', update)
    }
  }, [snapshot])

  return frame
}

export function TurnoutCount() {
  const [stored, setStored] = useState<TurnoutSnapshot>()
  const { data, isError, isPending } = useQuery({
    queryKey: turnoutKey,
    queryFn: ({ client }) => fetchTurnout(client.getQueryData<TurnoutSnapshot>(turnoutKey)),
    staleTime: ({ state }) =>
      state.data
        ? Math.max(0, state.data.receivedAt + TURNOUT_REFRESH_MS - state.dataUpdatedAt)
        : 0,
    refetchInterval: ({ state }) =>
      state.status === 'success' && state.data
        ? Math.max(1000, state.data.receivedAt + TURNOUT_REFRESH_MS - Date.now())
        : TURNOUT_REFRESH_MS,
    retry: false,
  })

  useEffect(() => {
    function readStored(event?: StorageEvent) {
      if (!event || event.key === TURNOUT_STORAGE_KEY) setStored(readTurnoutSnapshot())
    }

    readStored()
    window.addEventListener('storage', readStored)
    return () => window.removeEventListener('storage', readStored)
  }, [])

  const snapshot = stored && (!data || stored.receivedAt > data.receivedAt) ? stored : data
  const frame = useTurnoutFrame(snapshot)
  const count = frame?.count ?? snapshot?.growth?.from ?? snapshot?.ballotsCast
  const caption = snapshot
    ? count === 1
      ? 'Ballot cast'
      : 'Ballots cast'
    : isPending
      ? 'Loading turnout…'
      : 'Live turnout is unavailable.'
  const isCatchingUp = snapshot && count !== snapshot.ballotsCast

  return (
    <div
      className="grid flex-1 content-center justify-items-center py-8 text-center"
      aria-busy={isPending && !snapshot}
    >
      <span aria-live="polite" className="sr-only">
        {snapshot
          ? `${formatCount(snapshot.ballotsCast)} ${snapshot.ballotsCast === 1 ? 'ballot cast' : 'ballots cast'} reported`
          : null}
      </span>
      <span
        aria-hidden="true"
        className="grid overflow-hidden text-[clamp(6rem,min(20vw,32svh),18rem)] leading-none italic [font-family:var(--landing-fraunces),Georgia,serif]"
      >
        {frame?.previous !== undefined && (
          <span
            key={`previous-${count}`}
            className="col-start-1 row-start-1 motion-safe:animate-[election-turnout-out_280ms_ease-in-out_both] motion-reduce:hidden"
          >
            {formatCount(frame.previous)}
          </span>
        )}
        <span
          key={count}
          className={`col-start-1 row-start-1 ${frame?.previous === undefined ? '' : 'motion-safe:animate-[election-turnout-in_280ms_ease-in-out_both]'}`}
        >
          {count === undefined ? '—' : formatCount(count)}
        </span>
      </span>
      <p
        aria-hidden={snapshot ? true : undefined}
        aria-live={snapshot ? undefined : 'polite'}
        className="text-[0.8rem] tracking-[0.12em] uppercase"
      >
        {caption}
      </p>
      {snapshot && (
        <p className="mt-2 text-[0.8rem]">
          {formatCount(snapshot.approvedVoters)} approved{' '}
          {snapshot.approvedVoters === 1 ? 'Voter' : 'Voters'} ·{' '}
          {snapshot.electionStatus === 'OPEN' ? 'Voting is open' : 'Voting is closed'}
        </p>
      )}
      {isCatchingUp ? (
        <p className="mt-1 text-[0.8rem]">Updating to the latest reported count.</p>
      ) : snapshot && isError ? (
        <p className="mt-1 text-[0.8rem]">Showing the last reported count.</p>
      ) : null}
    </div>
  )
}
