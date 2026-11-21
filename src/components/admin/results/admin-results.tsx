'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ResultsTally } from '@/components/results/results-tally'
import { useTRPC } from '@/lib/trpc/client'
import {
  AdminLoadError,
  AdminPage,
  ConfirmDialog,
  adminButton,
  adminErrorMessage,
  adminField,
  adminLink,
  formatDateTime,
  isAccessError,
} from '../admin-ui'
import { ResultsSkeleton } from '../admin-skeletons'

const CONFIRM_PHRASE = 'RELEASE'

export function AdminResults() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  // Every pre-release view writes VIEW_RESULTS, so load once and never poll.
  const results = useQuery({
    ...trpc.results.get.queryOptions({ audience: 'admin' }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: 0,
    retry: (failureCount, error) => failureCount < 1 && !isAccessError(error),
  })
  const dashboard = useQuery({ ...trpc.admin.getDashboard.queryOptions(), retry: false })
  const release = useMutation(trpc.admin.releaseResults.mutationOptions())
  const [confirming, setConfirming] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [releaseError, setReleaseError] = useState('')

  if (results.isPending) return <ResultsSkeleton />
  if (results.isError)
    return (
      <AdminPage title="Results">
        <AdminLoadError error={results.error} onRetry={() => void results.refetch()} />
      </AdminPage>
    )

  const data = results.data
  const phase = dashboard.data?.phase
  const released = Boolean(data.releasedAt)
  const blockers = [
    phase && phase !== 'VOTING_CLOSED' && !released && 'Close the election first.',
    data.heldPending > 0 &&
      `${data.heldPending} held ${data.heldPending === 1 ? 'ballot is' : 'ballots are'} waiting on registration review.`,
  ].filter((reason): reason is string => Boolean(reason))
  const canRelease = !released && phase === 'VOTING_CLOSED' && data.heldPending === 0

  async function confirmRelease() {
    setReleaseError('')
    try {
      await release.mutateAsync()
      setConfirming(false)
      setPhrase('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.results.get.queryKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.admin.getDashboard.queryKey() }),
      ])
    } catch (error) {
      setReleaseError(adminErrorMessage(error, 'Unable to release results. Please try again.'))
      setConfirming(false)
    }
  }

  return (
    <AdminPage
      title="Results"
      subtitle={`${data.countedBallots.toLocaleString('en-US')} counted ballots`}
      aside={<p className="font-display text-2xl italic">{released ? 'Public' : 'Private'}</p>}
    >
      <section
        aria-label="Release"
        className="flex flex-wrap items-center justify-between gap-4 border border-review-line px-5 py-5"
      >
        <div className="grid gap-1">
          {released && data.releasedAt ? (
            <>
              <p>Released {formatDateTime(data.releasedAt)}. This release is final.</p>
              <Link href="/results" className={`${adminLink} text-xs`}>
                View public results
                <ArrowUpRight aria-hidden="true" size={12} />
              </Link>
            </>
          ) : (
            <>
              <p>Only admins can view these results until release. Each view is logged.</p>
              {blockers.map((reason) => (
                <p key={reason} className="text-xs text-review-muted">
                  {reason}
                </p>
              ))}
              {data.heldPending > 0 && (
                <Link href="/admin/registrations" className={`${adminLink} text-xs`}>
                  Review registrations
                  <ArrowUpRight aria-hidden="true" size={12} />
                </Link>
              )}
            </>
          )}
        </div>
        {!released && (
          <button
            type="button"
            className={adminButton}
            disabled={!canRelease || release.isPending}
            onClick={() => setConfirming(true)}
          >
            Release results
          </button>
        )}
      </section>
      {releaseError && (
        <p role="alert" className="mt-3 text-review-error">
          {releaseError}
        </p>
      )}

      <dl className="mt-6 grid gap-4 border-b border-review-line pb-4 text-xs min-[761px]:grid-cols-3">
        <div>
          <dt className="text-review-muted">Counted ballots</dt>
          <dd className="text-2xl tabular-nums">{data.countedBallots.toLocaleString('en-US')}</dd>
        </div>
        <div>
          <dt className="text-review-muted">Held · pending review</dt>
          <dd className="text-2xl tabular-nums">{data.heldPending.toLocaleString('en-US')}</dd>
        </div>
        <div>
          <dt className="text-review-muted">Held · rejected (not counted)</dt>
          <dd className="text-2xl tabular-nums">{data.heldRejected.toLocaleString('en-US')}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <ResultsTally results={data} />
      </div>

      <ConfirmDialog
        open={confirming}
        title="Release results?"
        confirmLabel="Release results"
        danger
        busy={release.isPending}
        confirmDisabled={phrase.trim() !== CONFIRM_PHRASE}
        onCancel={() => {
          setConfirming(false)
          setPhrase('')
        }}
        onConfirm={() => void confirmRelease()}
      >
        <p>
          Results become public immediately. Release is final: the election cannot reopen and
          results cannot be withdrawn.
        </p>
        <label className={adminField}>
          Type {CONFIRM_PHRASE} to confirm
          <input
            value={phrase}
            autoComplete="off"
            onChange={(event) => setPhrase(event.target.value)}
          />
        </label>
      </ConfirmDialog>
    </AdminPage>
  )
}
