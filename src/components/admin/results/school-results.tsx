'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ResultsTally } from '@/components/results/results-tally'
import { useTRPC } from '@/lib/trpc/client'
import { AdminLoadError, adminButton, adminField, isAccessError } from '../admin-ui'

/**
 * Results split by School. Admin-only even after release. Loaded only when asked for, because
 * each pre-release view is audited like the overall Results.
 */
export function SchoolResults() {
  const trpc = useTRPC()
  const [requested, setRequested] = useState(false)
  const [selected, setSelected] = useState('')
  const bySchool = useQuery({
    ...trpc.admin.getResultsBySchool.queryOptions(),
    enabled: requested,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: 0,
    retry: (failureCount, error) => failureCount < 1 && !isAccessError(error),
  })

  let body
  if (!requested) {
    body = (
      <button type="button" className={`${adminButton} mt-4`} onClick={() => setRequested(true)}>
        Show results by School
      </button>
    )
  } else if (bySchool.isPending) {
    body = <p className="mt-4 text-review-muted">Loading results by School…</p>
  } else if (bySchool.isError) {
    body = (
      <div className="mt-4">
        <AdminLoadError error={bySchool.error} onRetry={() => void bySchool.refetch()} />
      </div>
    )
  } else {
    const rows = bySchool.data
    const shown = rows.find((row) => row.school === selected) ?? rows[0]
    body = (
      <div className="mt-4 grid gap-4">
        <label className={`${adminField} max-w-xs`}>
          School
          <select value={shown?.school} onChange={(event) => setSelected(event.target.value)}>
            {rows.map((row) => (
              <option key={row.school} value={row.school}>
                {row.label} ({row.results.countedBallots.toLocaleString('en-US')} counted)
              </option>
            ))}
          </select>
        </label>
        {shown && <ResultsTally results={shown.results} />}
      </div>
    )
  }

  return (
    <section aria-labelledby="school-results-heading" className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-review-line pb-2">
        <h2 id="school-results-heading" className="font-display text-[28px] italic">
          Results by School
        </h2>
        <span className="text-xs text-review-muted">Admins only, even after release</span>
      </div>
      {body}
    </section>
  )
}
