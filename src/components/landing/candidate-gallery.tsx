import { displayHeading, sectionInner, sectionPadding } from './landing-styles'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import {
  CandidateOfficeGrid,
  candidateGalleryBackdrop,
  candidateGalleryDescription,
  candidateGalleryIntro,
} from '@/components/candidates/candidate-office-grid'

export function CandidateGallery() {
  return (
    <section
      id="candidates"
      className={`${sectionPadding} relative z-10 grid min-h-svh items-center ${candidateGalleryBackdrop} pt-[calc(var(--landing-header-space)+1rem)]`}
      aria-labelledby="candidate-heading"
    >
      <div className={sectionInner}>
        <div className={`mb-10 ${candidateGalleryIntro}`}>
          <h2
            id="candidate-heading"
            className={`${displayHeading} text-[clamp(2.75rem,7.78vw,7rem)] leading-[1.02]`}
          >
            Meet your
            <br /> next council.
          </h2>
          <p className={candidateGalleryDescription}>
            Get to know each{' '}
            <mark className="bg-(--landing-green) px-[0.28em] py-[0.05em] text-(--landing-cream)">
              candidate
            </mark>{' '}
            before you vote. Explore their profiles and what they stand for.
          </p>
        </div>
        <CandidateOfficeGrid preview />
        <Link
          href="/candidates"
          className="mt-10 flex min-h-14 items-center justify-between gap-2 border border-(--landing-green)/45 px-4 text-2xl hover:underline hover:underline-offset-4 [font-family:var(--landing-text),Georgia,serif]"
        >
          View all candidates <ArrowUpRight aria-hidden="true" className="size-5 shrink-0" />
        </Link>
      </div>
    </section>
  )
}
