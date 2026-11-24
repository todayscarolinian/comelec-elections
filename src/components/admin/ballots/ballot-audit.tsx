'use client'

import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import {
  YEAR_LEVELS,
  type YearLevel,
  yearLevelLabel,
} from '@/server/trpc/api/v1/registration/schema'
import {
  AdminLoadError,
  AdminPage,
  adminButton,
  adminErrorMessage,
  adminField,
  adminLink,
  adminSecondaryButton,
  adminTable,
  formatDateTime,
  isAccessError,
} from '../admin-ui'
import { TableSkeleton } from '../admin-skeletons'

type BallotStatus = 'COUNTED' | 'HELD_PENDING' | 'HELD_REJECTED'
type Filters = { yearLevel?: YearLevel; status?: BallotStatus; search?: string }

const statusLabels: Record<BallotStatus, string> = {
  COUNTED: 'Counted',
  HELD_PENDING: 'Held · pending',
  HELD_REJECTED: 'Held · rejected',
}

function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function BallotAudit() {
  const trpc = useTRPC()
  const [filters, setFilters] = useState<Filters>({})
  const [draft, setDraft] = useState({ search: '', yearLevel: '', status: '' })
  const [exportError, setExportError] = useState('')
  // Each page load writes VIEW_BALLOTS, so fetch only on explicit filter changes.
  const ballots = useInfiniteQuery({
    ...trpc.admin.listBallots.infiniteQueryOptions(filters, {
      getNextPageParam: (page) => page.nextCursor ?? undefined,
    }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: 0,
    retry: (failureCount, error) => failureCount < 1 && !isAccessError(error),
  })
  const exportBallots = useMutation(trpc.admin.exportBallots.mutationOptions())

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setFilters({
      ...(draft.search.trim() && { search: draft.search.trim() }),
      ...(draft.yearLevel && { yearLevel: draft.yearLevel as YearLevel }),
      ...(draft.status && { status: draft.status as BallotStatus }),
    })
  }

  async function runExport() {
    setExportError('')
    try {
      const { filename, csv } = await exportBallots.mutateAsync()
      downloadCsv(filename, csv)
    } catch (error) {
      setExportError(adminErrorMessage(error, 'Unable to export ballots. Please try again.'))
    }
  }

  const rows = ballots.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <AdminPage
      title="Ballot audit"
      subtitle="Viewing or exporting ballots is recorded in the activity log."
      aside={
        <button
          type="button"
          className={adminSecondaryButton}
          disabled={exportBallots.isPending}
          onClick={() => void runExport()}
        >
          <Download aria-hidden="true" size={16} />
          {exportBallots.isPending ? 'Exporting…' : 'Export CSV'}
        </button>
      }
    >
      {exportError && (
        <p role="alert" className="mb-3 text-review-error">
          {exportError}
        </p>
      )}
      <form
        onSubmit={applyFilters}
        className="grid gap-3 min-[761px]:grid-cols-[minmax(0,1fr)_180px_160px_auto] min-[761px]:items-end"
      >
        <label className={adminField}>
          Search voters
          <input
            type="search"
            placeholder="Name or USC email (@usc.edu.ph)"
            value={draft.search}
            onChange={(event) => setDraft({ ...draft, search: event.target.value })}
          />
        </label>
        <label className={adminField}>
          Status
          <select
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value })}
          >
            <option value="">All statuses</option>
            {(Object.keys(statusLabels) as BallotStatus[]).map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className={adminField}>
          Year level
          <select
            value={draft.yearLevel}
            onChange={(event) => setDraft({ ...draft, yearLevel: event.target.value })}
          >
            <option value="">All years</option>
            {YEAR_LEVELS.map((value) => (
              <option key={value} value={value}>
                {yearLevelLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={adminButton}>
          Apply
        </button>
      </form>

      <div className="mt-6">
        {ballots.isPending ? (
          <TableSkeleton label="Loading ballots…" columns={5} />
        ) : ballots.isError && !rows.length ? (
          <AdminLoadError error={ballots.error} onRetry={() => void ballots.refetch()} />
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className={adminTable}>
              <thead>
                <tr>
                  <th scope="col">Voter</th>
                  <th scope="col">Year</th>
                  <th scope="col">Cast</th>
                  <th scope="col">Status</th>
                  <th scope="col">Choices</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="block font-editorial text-base">{row.name}</span>
                      <span className="wrap-anywhere text-review-muted">{row.email}</span>
                    </td>
                    <td>{yearLevelLabel(row.yearLevel)}</td>
                    <td className="whitespace-nowrap">
                      <time dateTime={row.castAt.toISOString()}>{formatDateTime(row.castAt)}</time>
                    </td>
                    <td className={row.status === 'COUNTED' ? '' : 'text-review-error'}>
                      {statusLabels[row.status]}
                    </td>
                    <td>
                      <dl className="grid gap-1">
                        {row.choices.map((choice) => (
                          <div key={choice.questionId}>
                            <dt className="inline text-review-muted">{choice.questionTitle}: </dt>
                            <dd className="inline">
                              {choice.abstained ? 'Abstain' : choice.candidates.join(', ')}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-review-muted">No ballots match these filters.</p>
        )}
        {ballots.hasNextPage && (
          <button
            type="button"
            className={`${adminLink} mt-4 border-0 bg-transparent p-0`}
            disabled={ballots.isFetchingNextPage}
            onClick={() => void ballots.fetchNextPage()}
          >
            {ballots.isFetchingNextPage ? 'Loading…' : 'Load more ballots'}
          </button>
        )}
        {ballots.isFetchNextPageError && (
          <p role="alert" className="mt-2 text-review-error">
            Unable to load more ballots. Please try again.
          </p>
        )}
      </div>
    </AdminPage>
  )
}
