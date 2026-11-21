import { displayHeading, sectionInner, sectionPadding } from './landing-styles'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { CandidateDef } from '@/election'
import { CANDIDATE_OFFICES as offices, candidateHref } from '@/lib/candidates'

function CandidateCard({ candidate }: { candidate: CandidateDef }) {
  return (
    <li className="min-w-0 self-start bg-(--landing-cream)">
      <Image
        src={candidate.photo}
        alt=""
        width={304}
        height={304}
        sizes="(max-width: 38rem) 50vw, 25vw"
        className="aspect-square h-auto w-full object-cover"
      />
      <h4 className="mt-2 text-[clamp(1rem,1.5vw,1.25rem)] leading-tight break-words [font-family:var(--landing-text),Georgia,serif]">
        {candidate.name}
      </h4>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
        <span
          className="border border-(--landing-green)/35 px-2 py-1 text-xs data-[party=Tingog]:border-[#c80968] data-[party=STAND]:border-[#9d781d]"
          data-party={candidate.party}
        >
          {candidate.party ?? 'Independent'}
        </span>
        <Link
          href={candidateHref(candidate.id)}
          className="inline-flex min-h-11 items-center gap-1 hover:underline hover:underline-offset-4"
        >
          View profile <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only"> for {candidate.name}</span>
        </Link>
      </div>
    </li>
  )
}

export function CandidateGallery() {
  return (
    <section
      id="candidates"
      className={`${sectionPadding} relative z-10 grid min-h-svh items-center bg-(--landing-cream) bg-[url('/landing/gallery.webp')] bg-top bg-size-[min(100%,100rem)_auto] pt-[calc(var(--landing-header-space)+1rem)]`}
      aria-labelledby="candidate-heading"
    >
      <div className={sectionInner}>
        <div className="mb-10 flex items-center justify-between gap-6 max-[38rem]:flex-col max-[38rem]:items-start">
          <h2
            id="candidate-heading"
            className={`${displayHeading} text-[clamp(2.75rem,7.78vw,7rem)] leading-[1.02]`}
          >
            Meet your
            <br /> next council.
          </h2>
          <p className="max-w-[22.2rem] text-[clamp(1rem,1.4vw,1.25rem)] leading-[1.12] text-[#647357]">
            Get to know each{' '}
            <mark className="bg-(--landing-green) px-[0.28em] py-[0.05em] text-(--landing-cream)">
              candidate
            </mark>{' '}
            before you vote. Explore their profiles and what they stand for.
          </p>
        </div>
        <div className="grid gap-x-8 gap-y-10 min-[38.01rem]:grid-cols-2">
          {offices.map((office, index) => (
            <section
              key={office.id}
              aria-labelledby={`office-${office.id}`}
              className={index >= 2 ? 'col-span-full' : undefined}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3
                  id={`office-${office.id}`}
                  className="text-xl leading-tight italic [font-family:var(--landing-fraunces),Georgia,serif]"
                >
                  {office.title}
                </h3>
                {office.candidates.length > 0 && (
                  <span className="text-right text-xs uppercase text-(--landing-muted)">
                    {String(office.candidates.length).padStart(2, '0')}{' '}
                    {office.candidates.length === 1 ? 'candidate' : 'candidates'}
                  </span>
                )}
              </div>
              {office.candidates.length > 0 ? (
                <ul
                  className={`mt-4 grid grid-cols-2 gap-[clamp(0.75rem,2.24vw,2rem)] ${index >= 2 ? 'min-[38.01rem]:grid-cols-4' : ''}`}
                >
                  {office.candidates.slice(0, index < 2 ? 2 : 4).map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-(--landing-muted)">
                  Councilor profiles have yet to be published.
                </p>
              )}
            </section>
          ))}
        </div>
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
