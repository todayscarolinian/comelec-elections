import { displayHeading, sectionInner, sectionPadding } from './landing-styles'
import Image from 'next/image'
import { ELECTION, type CandidateDef, type ElectionDef } from '@/election'

const election: ElectionDef = ELECTION
const officeNames = ['President', 'Vice Presidents', 'Councilors'] as const

const offices =
  election.title === 'Placeholder Election'
    ? officeNames.map((title, index) => ({
        id: String(index),
        title,
        candidates: election.questions[index]?.candidates ?? [],
      }))
    : election.questions

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
      <details className="text-sm [&>p]:text-(--landing-muted)">
        <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-2 gap-y-1 hover:[&>span:last-child]:underline [&::-webkit-details-marker]:hidden">
          <span
            className="border border-(--landing-green)/35 px-2 py-1 text-xs data-[party=Tingog]:border-[#c80968] data-[party=STAND]:border-[#9d781d]"
            data-party={candidate.party}
          >
            {candidate.party ?? 'Independent'}
          </span>
          <span>
            View profile <span aria-hidden="true">↗</span>
            <span className="sr-only"> for {candidate.name}</span>
          </span>
        </summary>
        <p>{candidate.bio}</p>
      </details>
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
        <details className="mt-10">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 border border-(--landing-green)/45 px-4 text-2xl hover:underline hover:underline-offset-4 [font-family:var(--landing-text),Georgia,serif] [&::-webkit-details-marker]:hidden">
            View all candidates <span aria-hidden="true">↗</span>
          </summary>
          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-6 [&_summary]:cursor-pointer [&_summary]:py-1.5">
            {offices.map((office) => (
              <section key={office.id} aria-labelledby={`directory-office-${office.id}`}>
                <h3
                  id={`directory-office-${office.id}`}
                  className="mb-2 text-xl italic [font-family:var(--landing-display),Georgia,serif]"
                >
                  {office.title}
                </h3>
                {office.candidates.length > 0 ? (
                  <ul>
                    {office.candidates.map((candidate) => (
                      <li key={candidate.id}>
                        <details>
                          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 border border-(--landing-green)/45 px-4 text-2xl hover:underline hover:underline-offset-4 [font-family:var(--landing-text),Georgia,serif] [&::-webkit-details-marker]:hidden">
                            {candidate.name} · {candidate.party ?? 'Independent'}
                          </summary>
                          <p>{candidate.bio}</p>
                        </details>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Councilor profiles have yet to be published.</p>
                )}
              </section>
            ))}
          </div>
        </details>
      </div>
    </section>
  )
}
