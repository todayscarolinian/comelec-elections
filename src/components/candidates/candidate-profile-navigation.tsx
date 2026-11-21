'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { candidateHref, candidateQueryString, readCandidateFilters } from '@/lib/candidates'

export function CandidateProfileNavigation({
  top = false,
  nextCandidate,
}: {
  top?: boolean
  nextCandidate?: { id: string; name: string }
}) {
  const searchParams = useSearchParams()
  const query = candidateQueryString(readCandidateFilters(searchParams))
  return (
    <nav
      aria-label={top ? 'Back to candidates' : 'Candidate navigation'}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs"
    >
      <Link
        href={`/candidates${query}`}
        className="inline-flex min-h-11 items-center gap-2 hover:underline hover:underline-offset-4"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        {top ? 'All candidates' : 'Back to candidates'}
      </Link>
      {!top && nextCandidate && (
        <Link
          href={`${candidateHref(nextCandidate.id)}${query}`}
          className="inline-flex min-h-11 items-center gap-2 hover:underline hover:underline-offset-4"
        >
          Next candidate <ArrowRight aria-hidden="true" className="size-3.5" />
          <span className="sr-only">: {nextCandidate.name}</span>
        </Link>
      )}
    </nav>
  )
}
