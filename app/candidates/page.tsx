import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  CandidatesDirectory,
  CandidatesDirectoryFallback,
} from '@/components/candidates/candidates-directory'
import { electionContent } from '@/components/election/election-styles'

export const metadata: Metadata = {
  title: 'Candidates',
  description:
    'Meet the candidates for the SSC Elections. Browse by office or party and explore their platforms.',
}

export default function CandidatesPage() {
  return (
    <>
      <div className={`${electionContent} pb-14 pt-10 sm:pt-14 lg:pb-16 lg:pt-16`}>
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end md:gap-10">
          <h1 className="font-display text-[clamp(3.5rem,7.5vw,7rem)] leading-[1.05] tracking-[-0.025em] italic">
            The candidates
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-comelec-olive md:pb-1 lg:text-base">
            Meet the people running for your next council. Open a profile to read their platform.
          </p>
        </header>
        <Suspense fallback={<CandidatesDirectoryFallback />}>
          <CandidatesDirectory />
        </Suspense>
      </div>
      <section aria-labelledby="choice-heading" className="bg-comelec-forest text-comelec-cream">
        <div
          className={`${electionContent} flex flex-col justify-between gap-7 py-12 sm:flex-row sm:items-center sm:py-14 lg:py-16`}
        >
          <div>
            <h2 id="choice-heading" className="font-display text-4xl italic sm:text-5xl">
              Make your choice count.
            </h2>
            <p className="mt-3 text-sm text-comelec-cream/85">
              Explore their platforms before you vote.
            </p>
          </div>
          <Link
            href="/#voting"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start border border-comelec-sage bg-comelec-cream px-10 py-3 text-sm font-medium text-comelec-forest hover:bg-comelec-sage-soft sm:self-auto focus-visible:outline-comelec-cream!"
          >
            Go to ballot <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
