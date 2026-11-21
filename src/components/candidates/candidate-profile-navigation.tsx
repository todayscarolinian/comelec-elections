'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { candidateHref, candidateQueryString, readCandidateFilters } from '@/lib/candidates'

const profileLink =
  'group inline-flex min-h-12 items-center gap-2.5 font-medium hover:underline hover:underline-offset-4'
const arrowMotion = 'size-4 shrink-0 motion-safe:transition-transform motion-safe:duration-150'

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
      className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
    >
      {top ? (
        <Link href={`/candidates${query}`} className={profileLink}>
          <ArrowLeft
            aria-hidden="true"
            className={`${arrowMotion} motion-safe:group-hover:-translate-x-1`}
          />
          All candidates
        </Link>
      ) : previousCandidate ? (
        <Link
          href={`${candidateHref(previousCandidate.id)}${query}`}
          className={profileLink}
          rel="prev"
        >
          <ArrowLeft
            aria-hidden="true"
            className={`${arrowMotion} motion-safe:group-hover:-translate-x-1`}
          />{' '}
          Previous candidate
          <span className="sr-only">: {previousCandidate.name}</span>
        </Link>
      ) : null}
      {!top && nextCandidate && (
        <Link
          href={`${candidateHref(nextCandidate.id)}${query}`}
          className={`ms-auto ${profileLink}`}
          rel="next"
        >
          Next candidate{' '}
          <ArrowRight
            aria-hidden="true"
            className={`${arrowMotion} motion-safe:group-hover:translate-x-1`}
          />
          <span className="sr-only">: {nextCandidate.name}</span>
        </Link>
      )}
    </nav>
  )
}
