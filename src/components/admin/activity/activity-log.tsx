'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import type { AuditAction } from '@/server/trpc/api/v1/audit/schema'
import {
  AdminLoadError,
  AdminPage,
  adminField,
  adminLink,
  adminTable,
  formatDateTime,
  isAccessError,
} from '../admin-ui'
import { TableSkeleton } from '../admin-skeletons'
import { AUDIT_ACTION_FILTERS, auditLabel } from '../audit-labels'

export function ActivityLog() {
  const trpc = useTRPC()
  const [action, setAction] = useState<AuditAction | ''>('')
  const log = useInfiniteQuery({
    ...trpc.admin.listAuditLog.infiniteQueryOptions(action ? { action } : {}, {
      getNextPageParam: (page) => page.nextCursor ?? undefined,
    }),
    retry: (failureCount, error) => failureCount < 1 && !isAccessError(error),
  })
  const rows = log.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <AdminPage title="Activity log" subtitle="Every admin action, including views of ballots.">
      <label className={`${adminField} max-w-[320px]`}>
        Action
        <select value={action} onChange={(event) => setAction(event.target.value as AuditAction)}>
          <option value="">All actions</option>
          {AUDIT_ACTION_FILTERS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-6">
        {log.isPending ? (
          <TableSkeleton label="Loading activity…" columns={4} rows={8} />
        ) : log.isError && !rows.length ? (
          <AdminLoadError error={log.error} onRetry={() => void log.refetch()} />
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className={adminTable}>
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Admin</th>
                  <th scope="col">Action</th>
                  <th scope="col">Target</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap text-review-muted">
                      <time dateTime={entry.at.toISOString()}>{formatDateTime(entry.at)}</time>
                    </td>
                    <td className="wrap-anywhere">{entry.adminEmail}</td>
                    <td>{auditLabel(entry.action, entry.detail)}</td>
                    <td className="wrap-anywhere text-review-muted">{entry.target ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-review-muted">No activity recorded.</p>
        )}
        {log.hasNextPage && (
          <button
            type="button"
            className={`${adminLink} mt-4 border-0 bg-transparent p-0`}
            disabled={log.isFetchingNextPage}
            onClick={() => void log.fetchNextPage()}
          >
            {log.isFetchingNextPage ? 'Loading…' : 'Load older activity'}
          </button>
        )}
      </div>
    </AdminPage>
  )
}
