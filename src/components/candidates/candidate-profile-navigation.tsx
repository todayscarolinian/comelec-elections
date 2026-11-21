'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { candidateHref, candidateQueryString, readCandidateFilters } from '@/lib/candidates'

export function CandidateProfileNavigation({
  top = false,
  previousCandidate,
  nextCandidate,
}: {
  top?: boolean
  previousCandidate?: { id: string; name: string }
  nextCandidate?: { id: string; name: string }
}) {
  const searchParams = useSearchParams()
  const query = candidateQueryString(readCandidateFilters(searchParams))
  if (!top && !previousCandidate && !nextCandidate) return null

  return (
    <nav
      aria-label={top ? 'Back to candidates' : 'Candidate navigation'}
      className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs"
    >
      {top ? (
        <Link
          href={`/candidates${query}`}
          className="inline-flex min-h-11 items-center gap-2 hover:underline hover:underline-offset-4"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          All candidates
        </Link>
      ) : previousCandidate ? (
        <Link
          href={`${candidateHref(previousCandidate.id)}${query}`}
          className="inline-flex min-h-11 items-center gap-2 hover:underline hover:underline-offset-4"
          rel="prev"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" /> Previous candidate
          <span className="sr-only">: {previousCandidate.name}</span>
        </Link>
      ) : null}
      {!top && nextCandidate && (
        <Link
          href={`${candidateHref(nextCandidate.id)}${query}`}
          className="ms-auto inline-flex min-h-11 items-center gap-2 hover:underline hover:underline-offset-4"
          rel="next"
        >
          Next candidate <ArrowRight aria-hidden="true" className="size-3.5" />
          <span className="sr-only">: {nextCandidate.name}</span>
        </Link>
      )}
    </nav>
  )
}
