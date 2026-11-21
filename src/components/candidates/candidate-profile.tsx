import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { CANDIDATE_PROFILES } from '@/lib/candidate-profiles'
import type { DirectoryCandidate } from '@/lib/candidates'
import { CandidateParty } from './candidate-card'
import { CandidateProfileNavigation } from './candidate-profile-navigation'

export function CandidateProfile({
  candidate,
  previousCandidate,
  nextCandidate,
}: {
  candidate: DirectoryCandidate
  previousCandidate?: DirectoryCandidate
  nextCandidate?: DirectoryCandidate
}) {
  const profile = CANDIDATE_PROFILES[candidate.id]
  return (
    <article className="pb-4">
      <Suspense
        fallback={
          <Link href="/candidates" className="inline-flex min-h-11 items-center text-xs">
            ← All candidates
          </Link>
        }
      >
        <CandidateProfileNavigation top />
      </Suspense>

      <header className="mt-7 grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12 lg:mt-10 lg:gap-16">
        <Image
          src={candidate.photo}
          alt={candidate.name}
          width={500}
          height={500}
          sizes="(max-width: 767px) 100vw, 33vw"
          className="aspect-square h-auto w-full bg-comelec-sage/20 object-cover"
        />
        <div>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <p className="text-xs tracking-[0.05em] text-comelec-olive uppercase">
              {candidate.officeTitle}
            </p>
            <CandidateParty party={candidate.party} />
          </div>
          <h1 className="mt-5 font-display text-[clamp(3rem,6.5vw,6rem)] leading-[1.05] tracking-[-0.025em] italic wrap-anywhere">
            {candidate.name}
          </h1>
          <p className="mt-5 text-sm text-comelec-olive">
            {profile?.academicDetails ?? 'Academic details to be announced.'}
          </p>
          <div className="mt-6 border-t border-comelec-sage pt-5">
            <p className="text-xs">Candidate no. {String(candidate.number).padStart(2, '0')}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-comelec-olive">
              {candidate.bio}
            </p>
            {profile && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-comelec-olive">
                {profile.introduction}
              </p>
            )}
          </div>
        </div>
      </header>

      {profile?.sample && (
        <p className="mt-8 border-l-2 border-comelec-sage pl-3 text-xs leading-relaxed text-comelec-olive">
          Placeholder profile · The platform and commitments below are sample content for this
          preview, not an official candidate platform.
        </p>
      )}

      <section aria-labelledby="platform-heading" className="mt-10 lg:mt-12">
        <h2 id="platform-heading" className="font-display text-3xl italic sm:text-4xl">
          Platform priorities
        </h2>
        {profile?.priorities.length ? (
          <ol className="mt-2">
            {profile.priorities.map((priority, index) => (
              <li
                key={priority}
                className="grid grid-cols-[2rem_1fr] items-baseline gap-4 border-b border-comelec-sage py-5 sm:grid-cols-[3rem_1fr]"
              >
                <span className="text-xs text-comelec-olive">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="font-editorial text-xl leading-relaxed sm:text-2xl">{priority}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-comelec-olive">
            Platform priorities have yet to be published.
          </p>
        )}
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16 lg:mt-12">
        <section aria-labelledby="commitments-heading">
          <h2 id="commitments-heading" className="font-editorial text-3xl">
            Campaign commitments
          </h2>
          {profile?.commitments.length ? (
            <ul className="mt-4 list-disc space-y-3 pl-4 text-sm leading-relaxed marker:text-comelec-forest">
              {profile.commitments.map((commitment) => (
                <li key={commitment}>{commitment}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-comelec-olive">
              Campaign commitments have yet to be published.
            </p>
          )}
        </section>
        <section aria-labelledby="experience-heading">
          <h2 id="experience-heading" className="font-editorial text-3xl">
            Experience
          </h2>
          {profile?.experience.length ? (
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-comelec-olive">
              {profile.experience.map((experience) => (
                <li key={experience}>{experience}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-comelec-olive">
              Candidate experience has yet to be published.
            </p>
          )}
        </section>
      </div>

      <div className="mt-10 border-b border-comelec-sage pb-5 lg:mt-12">
        <Suspense fallback={<div aria-hidden="true" className="min-h-11" />}>
          <CandidateProfileNavigation
            previousCandidate={previousCandidate}
            nextCandidate={nextCandidate}
          />
        </Suspense>
      </div>
      <p className="mt-8 text-xs leading-relaxed text-comelec-olive">
        {profile?.sample
          ? 'Official candidate information will be supplied by the election committee.'
          : 'Candidate information is supplied by the election committee.'}{' '}
        Profiles follow ballot order.
      </p>
    </article>
  )
}
