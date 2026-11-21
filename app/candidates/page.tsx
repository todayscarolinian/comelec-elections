import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BallotEntry } from '@/components/ballot/ballot-entry'
import {
  candidateGalleryBackdrop,
  candidateGalleryDescription,
  candidateGalleryIntro,
} from '@/components/candidates/candidate-office-grid'
import {
  CandidatesDirectory,
  CandidatesDirectoryFallback,
} from '@/components/candidates/candidates-directory'
import { electionContent } from '@/components/election/election-styles'
import { fraunces } from '@/components/election/election-fonts'
import { sectionPadding } from '@/components/landing/landing-styles'

export const metadata: Metadata = {
  title: 'Candidates',
  description:
    'Meet the candidates for the SSC Elections. Browse by office or party and explore their platforms.',
}

export default function CandidatesPage() {
  return (
    <>
      <div className={`${candidateGalleryBackdrop} ${sectionPadding} ${fraunces.variable}`}>
        <div className={electionContent}>
          <header className={candidateGalleryIntro}>
            <h1 className="font-display text-[clamp(2.75rem,7.78vw,7rem)] leading-[1.02] tracking-[-0.045em] italic">
              The candidates
            </h1>
            <p className={candidateGalleryDescription}>
              Meet the people running for your next council. Open a profile to read their platform.
            </p>
          </header>
          <Suspense fallback={<CandidatesDirectoryFallback />}>
            <CandidatesDirectory />
          </Suspense>
        </div>
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
          <BallotEntry className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 self-start border border-comelec-sage bg-comelec-cream px-10 py-3 text-sm font-medium text-comelec-forest hover:bg-comelec-sage-soft sm:self-auto focus-visible:outline-comelec-cream!">
            Go to ballot <ArrowUpRight aria-hidden="true" className="size-4" />
          </BallotEntry>
        </div>
      </section>
    </>
  )
}
