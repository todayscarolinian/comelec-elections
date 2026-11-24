'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { inferRouterOutputs } from '@trpc/server'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { electionDay } from '@/components/landing/landing-schedule'
import { useTRPC } from '@/lib/trpc/client'
import { yearLevelLabel } from '@/server/trpc/api/v1/registration/schema'
import type { AppRouter } from '@/server/trpc/root'
import {
  AdminLoadError,
  AdminPage,
  ConfirmDialog,
  adminButton,
  adminErrorMessage,
  adminLink,
  formatTime,
  isAccessError,
} from '../admin-ui'
import { SchoolTurnoutTable } from './school-turnout-table'
import { DashboardSkeleton } from '../admin-skeletons'
import { auditLabel } from '../audit-labels'

type Dashboard = inferRouterOutputs<AppRouter>['admin']['getDashboard']
type Phase = Dashboard['phase']
type ElectionAction = 'OPEN' | 'CLOSED'

const ELECTION_DATE = `Nov ${electionDay}`

// Both header values come from the last fetch time, so they agree and render deterministically.
function dayLabel(phase: Phase, fetchedAt: number) {
  if (phase === 'RELEASED') return `${ELECTION_DATE} · Election complete`
  const manila = new Date(new Date(fetchedAt).toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const beforeDay =
    manila.getMonth() < 10 || (manila.getMonth() === 10 && manila.getDate() < electionDay)
  return beforeDay ? 'Before election day' : `${ELECTION_DATE} · Election day`
}

function updatedLabel(fetchedAt: number) {
  return formatTime(new Date(fetchedAt))
}

const banner: Record<
  Phase,
  {
    eyebrow: string
    title: string
    detail: (data: Dashboard) => string
    action?: { label: string; status: ElectionAction }
  }
> = {
  BEFORE_VOTING: {
    eyebrow: 'ELECTION STATUS',
    title: 'Before voting.',
    detail: () => 'Review registrations before opening the election.',
    action: { label: 'Open election', status: 'OPEN' },
  },
  VOTING_OPEN: {
    eyebrow: 'ELECTION STATUS',
    title: 'Voting is open.',
    detail: () => `${ELECTION_DATE} · 8:00 AM–5:00 PM`,
    action: { label: 'Close election', status: 'CLOSED' },
  },
  VOTING_CLOSED: {
    eyebrow: 'VOTING CLOSED',
    title: 'Voting is closed.',
    detail: (data) =>
      `${data.votingClosedAt ? `Closed at ${formatTime(data.votingClosedAt)} · ` : ''}Results are still private.`,
    action: { label: 'Reopen election', status: 'OPEN' },
  },
  RELEASED: {
    eyebrow: 'ELECTION COMPLETE',
    title: 'Election complete.',
    detail: (data) =>
      data.resultsReleasedAt
        ? `Results released ${data.resultsReleasedAt.toLocaleString('en-US', { month: 'short', day: 'numeric' })} at ${formatTime(data.resultsReleasedAt)}.`
        : 'Results released.',
  },
}

const confirmCopy: Record<ElectionAction, { title: string; body: string }> = {
  OPEN: {
    title: 'Open the election?',
    body: 'Registered voters can cast ballots as soon as the election opens.',
  },
  CLOSED: {
    title: 'Close the election?',
    body: 'Voters can no longer cast ballots or resubmit registrations. You can reopen the election until results are released.',
  },
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-review-muted">{label}</dt>
      <dd className="font-[Inter,Arial,sans-serif] text-[40px] leading-tight tabular-nums">
        {value.toLocaleString('en-US')}
      </dd>
      <dd className="text-[11px] text-review-muted">{detail}</dd>
    </div>
  )
}

export function AdminDashboard() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const dashboard = useQuery({
    ...trpc.admin.getDashboard.queryOptions(),
    refetchInterval: 30_000,
    retry: (failureCount, error) => failureCount < 1 && !isAccessError(error),
  })
  const [confirming, setConfirming] = useState<ElectionAction | null>(null)
  const [actionError, setActionError] = useState('')

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.admin.getDashboard.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.getRegistrationWindow.queryKey() }),
    ])
  }
  const setElection = useMutation(
    trpc.admin.setElectionStatus.mutationOptions({ onSettled: refresh }),
  )
  const setRegistration = useMutation(
    trpc.admin.setRegistrationStatus.mutationOptions({ onSettled: refresh }),
  )

  if (dashboard.isPending) return <DashboardSkeleton />
  if (dashboard.isError && !dashboard.data)
    return (
      <AdminPage title="Dashboard">
        <AdminLoadError error={dashboard.error} onRetry={() => void dashboard.refetch()} />
      </AdminPage>
    )

  const data = dashboard.data
  const copy = banner[data.phase]
  const registrationOpen = data.registrationStatus === 'OPEN'
  const released = data.phase === 'RELEASED'

  async function changeElection(status: ElectionAction) {
    setActionError('')
    try {
      await setElection.mutateAsync({ status })
      setConfirming(null)
    } catch (error) {
      setActionError(adminErrorMessage(error, 'Unable to update the election. Please try again.'))
      setConfirming(null)
    }
  }

  async function toggleRegistration() {
    setActionError('')
    try {
      await setRegistration.mutateAsync({ status: registrationOpen ? 'CLOSED' : 'OPEN' })
    } catch (error) {
      setActionError(
        adminErrorMessage(error, 'Unable to update the registration window. Please try again.'),
      )
    }
  }

  return (
    <AdminPage
      title="Dashboard"
      aside={
        <>
          <p className="text-sm">{dayLabel(data.phase, dashboard.dataUpdatedAt)}</p>
          <p className="mt-1 text-[11px] text-review-muted">
            Updated {updatedLabel(dashboard.dataUpdatedAt)}
          </p>
        </>
      }
    >
      <section
        aria-labelledby="election-status-heading"
        className="flex flex-wrap items-center justify-between gap-4 bg-review-ink px-5 py-6 text-[#effed4]"
      >
        <div>
          <p className="text-[10px]">{copy.eyebrow}</p>
          <h2
            id="election-status-heading"
            className="font-display text-[32px] italic leading-tight"
          >
            {copy.title}
          </h2>
          <p className="text-xs">{copy.detail(data)}</p>
        </div>
        {copy.action ? (
          <button
            type="button"
            className="min-h-13 w-full bg-review-paper px-6 text-base text-review-ink hover:bg-review-selected min-[761px]:w-[250px]"
            disabled={setElection.isPending}
            onClick={() => setConfirming(copy.action?.status ?? null)}
          >
            {copy.action.label}
          </button>
        ) : (
          <div className="grid w-full justify-items-center gap-2 min-[761px]:w-[250px]">
            <button
              type="button"
              disabled
              aria-describedby="reopen-locked-note"
              className="min-h-13 w-full bg-[#b6c89f] px-6 text-base text-review-ink !cursor-not-allowed"
            >
              Reopening locked
            </button>
            <p id="reopen-locked-note" className="text-[10px]">
              Release is final; election cannot reopen.
            </p>
          </div>
        )}
      </section>

      {actionError && (
        <p role="alert" className="mt-3 text-review-error">
          {actionError}
        </p>
      )}
      {dashboard.isError && (
        <p role="alert" className="mt-3 text-review-error">
          Unable to refresh the dashboard. Showing the last loaded data.
        </p>
      )}

      <dl className="mt-6 grid gap-6 border-b border-review-line pb-4 min-[761px]:grid-cols-3">
        <Metric label="Total ballots" value={data.ballotCount} detail="Recorded ballots" />
        <Metric
          label="Awaiting review"
          value={data.registrations.pending}
          detail="Manual registration review"
        />
        <Metric
          label="Registered voters"
          value={data.registrations.approved}
          detail={`${data.registrations.rejected.toLocaleString('en-US')} rejected · ${data.registrations.total.toLocaleString('en-US')} registrations`}
        />
      </dl>

      <div className="mt-5 grid gap-6 min-[1001px]:grid-cols-[minmax(0,1fr)_minmax(280px,426px)]">
        <section aria-labelledby="queue-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="queue-heading" className="font-display text-[28px] italic">
              Registration queue
            </h2>
            <span className="text-xs">{data.registrations.pending} awaiting review</span>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-16 gap-y-1 border-b border-review-line pb-2 text-[11px]">
            <span>Registration {registrationOpen ? 'open' : 'closed'}</span>
            <span className="text-review-muted">
              Review remains available after registration closes
            </span>
          </p>
          {data.pendingPreview.length ? (
            <ul>
              {data.pendingPreview.map((applicant) => (
                <li
                  key={applicant.id}
                  className="flex items-center justify-between gap-4 border-b border-review-line py-4"
                >
                  <div className="min-w-0">
                    <p className="font-editorial text-xl">{applicant.name}</p>
                    <p className="wrap-anywhere text-[11px] text-review-muted">{applicant.email}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-review-muted">
                    Declared {yearLevelLabel(applicant.yearLevel)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-b border-review-line py-6 text-review-muted">
              No registrations are waiting for review.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link href="/admin/registrations" className={`${adminButton} text-base`}>
              Review registrations
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
            <span className="text-[11px] text-review-muted">
              Approve or reject each application.
            </span>
          </div>
        </section>

        <aside
          aria-label="Windows and results"
          className="self-start border border-review-line px-5 py-6"
        >
          <p className="text-[10px] text-review-muted">REGISTRATION WINDOW</p>
          <p className="font-display text-[28px] italic leading-tight">
            {registrationOpen ? 'Open' : 'Closed'}
          </p>
          {data.phase === 'BEFORE_VOTING' ? (
            <button
              type="button"
              className={`${adminLink} border-0 bg-transparent p-0 text-xs`}
              disabled={setRegistration.isPending}
              onClick={() => void toggleRegistration()}
            >
              {registrationOpen ? 'Close registration' : 'Open registration'}
              <ArrowUpRight aria-hidden="true" size={12} />
            </button>
          ) : (
            <p className="text-xs">Reviews remain available</p>
          )}
          <hr className="my-5 border-review-line" />
          <p className="text-[10px] text-review-muted">ELECTION RESULTS</p>
          <p className="font-display text-[28px] italic leading-tight">
            {released ? 'Public' : 'Private'}
          </p>
          <p className="text-xs text-review-muted">
            {released
              ? 'Results are public. This release is final.'
              : 'Only admins can view results until release.'}
          </p>
          <Link href={released ? '/results' : '/admin/results'} className={`${adminLink} text-xs`}>
            {released
              ? 'View public results'
              : data.phase === 'VOTING_CLOSED'
                ? 'Review results for release'
                : 'View admin results'}
            <ArrowUpRight aria-hidden="true" size={12} />
          </Link>
        </aside>
      </div>

      <SchoolTurnoutTable rows={data.turnoutBySchool} />

      <section aria-labelledby="activity-heading" className="mt-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-review-line pb-2">
          <h2 id="activity-heading" className="font-display text-[28px] italic">
            Recent activity
          </h2>
          <Link href="/admin/activity" className={`${adminLink} text-xs`}>
            View activity log
            <ArrowUpRight aria-hidden="true" size={12} />
          </Link>
        </div>
        {data.recentActivity.length ? (
          <ul>
            {data.recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-1 border-b border-review-line py-3 text-xs min-[761px]:grid-cols-[136px_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <time dateTime={entry.at.toISOString()} className="text-review-muted">
                  {formatTime(entry.at)}
                </time>
                <span className="wrap-anywhere text-review-muted">{entry.adminEmail}</span>
                <span className="col-start-2 min-[761px]:col-start-auto">
                  {auditLabel(entry.action, entry.detail)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-review-muted">No admin activity yet.</p>
        )}
      </section>

      <ConfirmDialog
        open={confirming !== null}
        title={confirming ? confirmCopy[confirming].title : ''}
        confirmLabel={confirming === 'CLOSED' ? 'Close election' : 'Open election'}
        danger={confirming === 'CLOSED'}
        busy={setElection.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => confirming && void changeElection(confirming)}
      >
        <p>{confirming ? confirmCopy[confirming].body : ''}</p>
      </ConfirmDialog>
    </AdminPage>
  )
}
