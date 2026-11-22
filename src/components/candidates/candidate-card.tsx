import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { CandidateProfileContent } from '@/lib/candidate-profiles'
import { candidateHref } from '@/lib/candidates'
import { CandidatePortrait } from './candidate-portrait'

export function CandidateParty({ party }: { party?: string }) {
  return (
    <span className="inline-flex w-fit items-center border border-comelec-forest/35 px-2 py-0.5 text-xs leading-4">
      {party ?? 'Independent'}
    </span>
  )
}

export function CandidateCard({
  candidate,
  query = '',
  heading: Heading = 'h3',
}: {
  candidate: CandidateProfileContent
  query?: string
  heading?: 'h3' | 'h4'
}) {
  const href = `${candidateHref(candidate.id)}${query}`
  const academicDetails = [
    candidate.school,
    candidate.program,
    candidate.year && `Year ${candidate.year}`,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <li className="flex min-w-0 flex-col items-start border-t border-comelec-sage px-3 pt-3 sm:px-4 sm:pt-4">
      <CandidatePortrait
        candidate={candidate}
        sizes="(max-width: 32rem) calc(100vw - 4rem), (max-width: 64rem) 50vw, 24rem"
        className="mb-3"
      />
      <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-medium text-comelec-olive">Ballot #{candidate.number}</p>
        <CandidateParty party={candidate.party} />
      </div>
      <div className="mt-2 min-h-20 lg:max-xl:min-h-25">
        <Heading className="font-editorial text-[1.375rem] leading-tight wrap-anywhere">
          {candidate.name}
        </Heading>
        {academicDetails && (
          <p className="mt-1 text-sm leading-snug text-comelec-olive">{academicDetails}</p>
        )}
      </div>
      <Link
        href={href}
        className="mt-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-medium hover:underline hover:underline-offset-4"
      >
        View profile <ArrowUpRight aria-hidden="true" className="size-3.5" />
        <span className="sr-only">for {candidate.name}</span>
      </Link>
    </li>
  )
}
