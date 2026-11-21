'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { YEAR_LEVELS, type YearLevel } from '@/server/trpc/api/v1/registration/schema'
import { RegistrationReviewSkeleton } from '../admin-skeletons'
import { formatTime } from '../admin-ui'
import { ApplicationReview } from './application-review'
import { statusLabels, type RegistrationStatus } from './types'

const PAGE_SIZE = 5

function accessError(error: unknown) {
  const code = (error as { data?: { code?: string } } | null)?.data?.code
  return code === 'UNAUTHORIZED' || code === 'FORBIDDEN'
}

export function RegistrationReview() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RegistrationStatus | 'ALL'>('PENDING')
  const [year, setYear] = useState<YearLevel | 'ALL'>('ALL')
  const listOptions = trpc.admin.listRegistrations.queryOptions({
    ...(status !== 'ALL' ? { status } : {}),
    ...(year !== 'ALL' ? { yearLevel: year } : {}),
  })
  const registrationsQuery = useQuery({
    ...listOptions,
    refetchInterval: 60_000,
    gcTime: 0,
    retry: (failureCount, error) => failureCount < 1 && !accessError(error),
  })
  const windowQuery = useQuery({
    ...trpc.admin.getRegistrationWindow.queryOptions(),
    refetchInterval: 60_000,
    gcTime: 0,
    retry: false,
  })
  const registrations = registrationsQuery.data ?? []
  const approve = useMutation(trpc.admin.approveRegistration.mutationOptions())
  const rejectMutation = useMutation(trpc.admin.rejectRegistration.mutationOptions())
  const saving = approve.isPending || rejectMutation.isPending
  const [savedVersions, setSavedVersions] = useState<ReadonlyMap<string, number>>(new Map())
  const [saveError, setSaveError] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastFetchDenied, setLastFetchDenied] = useState(false)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [notice, setNotice] = useState('')
  const queueRef = useRef<HTMLHeadingElement>(null)
  const pending = windowQuery.data?.pendingCount
  const filtered = registrations.filter((item) =>
    `${item.name} ${item.email} ${item.studentId}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1))
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const selected = registrations.find((item) => item.id === selectedId)
  const deniedNow = registrationsQuery.isError && accessError(registrationsQuery.error)
  const loaded = !registrationsQuery.isError && !registrationsQuery.isPending
  const accessDenied = deniedNow || (lastFetchDenied && !loaded)
  if (accessDenied !== lastFetchDenied) setLastFetchDenied(accessDenied)
  // Choose a default only on entry or after an explicit filter change.
  if (selectedId === null && !accessDenied && visible[0]) setSelectedId(visible[0].id)
  if (mobileDetail && !selected) setMobileDetail(false)
  const selectedAlreadySaved =
    selected !== undefined && savedVersions.get(selected.id) === selected.submittedAt.getTime()

  function resetView() {
    setPage(0)
    setSelectedId(null)
    setMobileDetail(false)
  }
  function goToPage(nextPage: number) {
    setPage(nextPage)
    setSelectedId(filtered[nextPage * PAGE_SIZE]?.id ?? null)
    setMobileDetail(false)
  }
  function backToQueue() {
    setMobileDetail(false)
    requestAnimationFrame(() => queueRef.current?.focus())
  }
  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: trpc.admin.listRegistrations.queryKey() })
    await queryClient.invalidateQueries({ queryKey: trpc.admin.getRegistrationWindow.queryKey() })
  }
  async function decide(
    id: string,
    nextStatus: 'APPROVED' | 'REJECTED',
    nextYear: YearLevel,
    reason: string,
  ) {
    if (saving) return
    const applicant = registrations.find((item) => item.id === id)
    if (
      !applicant ||
      applicant.status !== 'PENDING' ||
      savedVersions.get(id) === applicant.submittedAt.getTime()
    )
      return
    setNotice('')
    setSaveError('')
    try {
      if (nextStatus === 'APPROVED')
        await approve.mutateAsync({ id, yearLevel: nextYear, submittedAt: applicant.submittedAt })
      else await rejectMutation.mutateAsync({ id, reason, submittedAt: applicant.submittedAt })
      setSavedVersions((versions) => new Map(versions).set(id, applicant.submittedAt.getTime()))
      setNotice(
        `${applicant.name} ${nextStatus === 'APPROVED' ? `approved for Year ${nextYear}` : 'rejected'}.`,
      )
      await refresh()
      backToQueue()
    } catch (error) {
      const code = (error as { data?: { code?: string } })?.data?.code
      setSaveError(
        accessError(error)
          ? "You don't have Admin access."
          : code === 'CONFLICT'
            ? 'This registration changed or was already reviewed. Refresh the queue before trying again.'
            : 'Unable to save the review. Please try again.',
      )
      if (code === 'CONFLICT' || accessError(error)) await refresh()
    }
  }

  if (registrationsQuery.isPending) return <RegistrationReviewSkeleton />
  if (accessDenied || (registrationsQuery.isError && !registrationsQuery.data))
    return (
      <main className="p-6 text-review-ink">
        <h1>Registration review</h1>
        <p role="alert">
          {accessDenied
            ? "You don't have Admin access."
            : 'Unable to load registrations. Please try again.'}
        </p>
        <button
          className="mt-4 min-h-11 underline"
          onClick={() => {
            void registrationsQuery.refetch()
          }}
        >
          Retry
        </button>
      </main>
    )

  return (
    <main
      id="review-main"
      className={`group min-w-0 px-4 py-6 min-[761px]:p-6 min-[1301px]:px-10 min-[1301px]:pb-10 ${mobileDetail && selected ? 'is-detail' : ''}`}
    >
      <header className="[&_p]:text-[11px] [&_p]:leading-4 [&_p]:text-review-muted [&_h1]:my-1.5 [&_h1]:font-display [&_h1]:text-[clamp(30px,8.5vw,40px)] [&_h1]:leading-[1.15] [&_h1]:italic min-[761px]:[&_h1]:my-0.5 min-[761px]:[&_h1]:text-5xl min-[761px]:[&_h1]:leading-[1.1] [&_span]:text-review-muted">
        <p>COMMISSION ADMIN</p>
        <h1>Registration review</h1>
        <span>
          {pending === undefined
            ? 'Pending count unavailable'
            : `${pending} applications awaiting review`}
        </span>
      </header>
      <p className="pt-2 text-[11px] text-review-muted">
        OCR findings are advisory. Review the student profile before deciding.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 max-[761px]:group-[.is-detail]:hidden min-[761px]:grid-cols-[minmax(0,1fr)_180px_130px] min-[761px]:gap-4 min-[1301px]:grid-cols-[minmax(0,1fr)_232px_160px]">
        <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px] col-span-full min-[761px]:col-span-1">
          Search applicants
          <input
            type="search"
            placeholder="Name or organizational email"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetView()
            }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as RegistrationStatus | 'ALL')
              resetView()
            }}
          >
            <option value="ALL">All statuses</option>
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
                {value === 'PENDING' && pending !== undefined ? ` (${pending})` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]">
          Year level
          <select
            value={year}
            onChange={(event) => {
              setYear(event.target.value as YearLevel | 'ALL')
              resetView()
            }}
          >
            <option value="ALL">All years</option>
            {YEAR_LEVELS.map((value) => (
              <option key={value} value={value}>
                Year {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
        <span className="text-[11px] text-review-muted">
          {registrationsQuery.isFetching
            ? 'Refreshing…'
            : registrationsQuery.dataUpdatedAt
              ? `Updated ${formatTime(new Date(registrationsQuery.dataUpdatedAt))}`
              : null}
        </span>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 border border-review-line bg-review-paper px-4 text-[13px] text-review-ink hover:bg-review-selected disabled:cursor-not-allowed disabled:text-review-muted disabled:hover:bg-review-paper min-[761px]:min-h-[42px]"
          disabled={saving || registrationsQuery.isFetching}
          aria-busy={registrationsQuery.isFetching}
          onClick={() => {
            void refresh()
          }}
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-3.5 ${registrationsQuery.isFetching ? 'motion-safe:animate-spin' : ''}`}
          />
          Refresh queue
        </button>
      </div>
      {registrationsQuery.isError && (
        <p role="alert" className="text-review-error">
          Unable to refresh registrations. Showing the last loaded queue.
        </p>
      )}
      <output className="block text-xs not-empty:py-3">{notice}</output>
      {saveError && (
        <p role="alert" className="text-review-error">
          {saveError}
        </p>
      )}
      <div className="mt-4 min-[761px]:grid min-[761px]:grid-cols-[240px_minmax(0,1fr)] min-[761px]:items-start min-[761px]:gap-4 min-[1301px]:grid-cols-[280px_minmax(0,1fr)] min-[1301px]:gap-6">
        <section
          className="min-w-0 border border-review-line max-[761px]:group-[.is-detail]:hidden [&_ul]:list-none [&_ul]:p-0 [&_li]:border-t [&_li]:border-review-line [&_li_button]:flex [&_li_button]:w-full [&_li_button]:flex-col [&_li_button]:gap-1 [&_li_button]:p-4 [&_li_button]:text-left [&_li_button:hover]:bg-review-selected min-[761px]:[&_li_button]:gap-0.5 min-[761px]:[&_li_button]:px-3 min-[761px]:[&_li_button]:py-2.5 [&_li_button>span:not(:first-child)]:text-xs [&_li_button>span:not(:first-child)]:text-review-muted [&_li_button>span]:wrap-anywhere"
          aria-labelledby="queue-heading"
        >
          <header className="p-3 [&_h2]:text-[13px] [&_h2]:leading-5 [&_h2]:font-medium [&_p]:mt-1 [&_p]:text-[11px] [&_p]:text-review-muted">
            <h2 id="queue-heading" tabIndex={-1} ref={queueRef}>
              {status === 'PENDING' ? 'Awaiting review' : 'Applications'}
            </h2>
            <p>
              {filtered.length} {status === 'PENDING' ? 'pending applications' : 'applications'}
            </p>
          </header>
          {visible.length ? (
            <ul>
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    className={selected?.id === item.id ? 'bg-review-selected' : ''}
                    aria-pressed={selected?.id === item.id}
                    onClick={() => {
                      setSelectedId(item.id)
                      setMobileDetail(true)
                    }}
                  >
                    <span className="font-editorial text-lg leading-6">{item.name}</span>
                    <span>
                      {item.studentId} · Year {item.yearLevel}
                    </span>
                    <span className="text-xs min-[761px]:!text-[10px]">
                      {item.email} · {statusLabels[item.status]}
                      {item.hasHeldBallot ? ' · Held Ballot' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-review-muted">No applications match these filters.</p>
          )}
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-review-line px-4 py-3 text-xs text-review-muted min-[761px]:px-3 [&>div]:flex [&>div]:flex-wrap [&>div]:gap-3">
            <span>
              {filtered.length
                ? `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`
                : '0 applications'}
            </span>
            <div>
              {currentPage > 0 && (
                <button
                  className="min-h-11 border-0 bg-transparent p-0 text-review-ink underline underline-offset-3 min-[761px]:min-h-7"
                  aria-label="Previous applicants"
                  onClick={() => goToPage(currentPage - 1)}
                >
                  ← Previous
                </button>
              )}
              {(currentPage + 1) * PAGE_SIZE < filtered.length && (
                <button
                  className="min-h-11 border-0 bg-transparent p-0 text-review-ink underline underline-offset-3 min-[761px]:min-h-7"
                  onClick={() => goToPage(currentPage + 1)}
                >
                  Next applicants →
                </button>
              )}
            </div>
          </footer>
        </section>
        {selected ? (
          <ApplicationReview
            key={`${selected.id}:${selected.submittedAt.toISOString()}:${selected.status}`}
            registration={selected}
            onDecision={decide}
            onBack={backToQueue}
            focusOnOpen={mobileDetail}
            saving={saving || selectedAlreadySaved}
            onRefresh={() => {
              void refresh()
            }}
          />
        ) : selectedId ? (
          <output className="block p-6 text-review-muted">
            This application is no longer in this queue.
          </output>
        ) : (
          <div className="hidden p-6 text-review-muted min-[761px]:block">
            Select different filters to find an application.
          </div>
        )}
      </div>
    </main>
  )
}
