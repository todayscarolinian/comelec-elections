'use client'

import { ArrowUpRight, Shuffle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  CandidateOfficeGrid,
  candidateGalleryBackdrop,
  candidateGalleryDescription,
  candidateGalleryIntro,
  candidatePreviewLimit,
} from '@/components/candidates/candidate-office-grid'
import { CANDIDATES, CANDIDATE_OFFICES, type DirectoryCandidate } from '@/lib/candidates'
import { displayHeading, sectionInner, sectionPadding } from './landing-styles'

const firstShufflableOffice = CANDIDATE_OFFICES.find(({ candidates }) => candidates.length > 1)

function shuffleCandidates(
  candidates: readonly DirectoryCandidate[],
  { changePreview = false } = {},
) {
  return CANDIDATE_OFFICES.flatMap((office, officeIndex) => {
    const group = candidates.filter((candidate) => candidate.officeId === office.id)
    const limit = candidatePreviewLimit(officeIndex)
    // Start with someone outside the current preview when the office has more candidates.
    const firstChoice = group.length > limit ? limit : 1
    for (let index = 0; index < group.length - 1; index++) {
      const start = changePreview && index === 0 ? firstChoice : index
      const swap = start + Math.floor(Math.random() * (group.length - start))
      const candidate = group[index]
      group[index] = group[swap]
      group[swap] = candidate
    }
    return group
  })
}

export function CandidateGallery() {
  const [candidates, setCandidates] = useState(CANDIDATES)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const initialPreview = shuffleCandidates(CANDIDATES)
      setCandidates((current) => (current === CANDIDATES ? initialPreview : current))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  function shuffle() {
    if (!firstShufflableOffice) return

    setCandidates(shuffleCandidates(candidates, { changePreview: true }))
    const section = document
      .getElementById(`office-${firstShufflableOffice.id}`)
      ?.closest('section')
    if (!section) return
    const firstName = section.querySelector('h4')
    if (firstName && firstName.getBoundingClientRect().bottom > window.innerHeight) {
      section.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
  }

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
          <div className="space-y-3">
            <p className={candidateGalleryDescription}>
              Get to know each{' '}
              <mark className="bg-(--landing-green) px-[0.28em] py-[0.05em] text-(--landing-cream)">
                candidate
              </mark>{' '}
              before you vote. Explore their profiles and what they stand for.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/candidates"
                className="inline-flex min-h-11 items-center gap-2 bg-(--landing-green) px-2.5 text-sm font-medium text-(--landing-cream) hover:bg-comelec-forest-dark"
              >
                View all candidates <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
              {firstShufflableOffice && (
                <button
                  type="button"
                  aria-controls="front-page-candidate-grid"
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-1 text-sm font-medium underline-offset-4 hover:underline"
                  onClick={shuffle}
                >
                  <Shuffle aria-hidden="true" size={16} />
                  Shuffle candidates
                </button>
              )}
            </div>
          </div>
        </div>
        <div
          id="front-page-candidate-grid"
          className="[&_section]:scroll-mt-[calc(var(--landing-header-space)+1rem)]"
        >
          <CandidateOfficeGrid candidates={candidates} preview />
        </div>
      </div>
    </section>
  )
}
