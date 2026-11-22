import Link from 'next/link'
import { Suspense } from 'react'
import type { DirectoryCandidate } from '@/lib/candidates'
import { CandidateParty } from './candidate-card'
import { CandidatePortrait } from './candidate-portrait'
import { CandidateProfileNavigation } from './candidate-profile-navigation'

const profileEntrance =
  'motion-safe:animate-[election-page-in_260ms_cubic-bezier(0.2,0.65,0.3,1)_backwards]'

export function CandidateProfile({
  candidate,
  previousCandidate,
  nextCandidate,
}: {
  candidate: DirectoryCandidate
  previousCandidate?: DirectoryCandidate
  nextCandidate?: DirectoryCandidate
}) {
  const details = [
    { label: 'School', value: candidate.school },
    { label: 'Program', value: candidate.program },
    { label: 'Year level', value: candidate.year },
    {
      label: 'Political party',
      value:
        candidate.party === 'STAND'
          ? 'Student Alliance for Nationalism and Democracy'
          : candidate.party === 'SPP'
            ? 'Student Power Party'
            : undefined,
    },
    { label: 'As a person', value: candidate.personalTrait },
    { label: 'As a student leader', value: candidate.leadershipTrait },
  ].filter(({ value }) => Boolean(value))

  return (
    <article key={candidate.id}>
      <Suspense
        fallback={
          <Link href="/candidates" className="inline-flex min-h-12 items-center text-sm">
            ← All candidates
          </Link>
        }
      >
        <CandidateProfileNavigation top />
      </Suspense>

      <div className="mt-3 grid gap-7 border-t border-comelec-sage pt-6 sm:pt-8 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,2.4fr)] lg:gap-12 lg:pt-10">
        <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-7">
          <header className={`order-1 min-w-0 ${profileEntrance}`}>
            <p className="text-base font-medium text-comelec-olive">
              {candidate.officeTitle} · Ballot #{candidate.number}
            </p>
            <h1 className="mt-2 max-w-5xl font-display text-[clamp(2.5rem,4.8vw,4.75rem)] leading-[1.05] tracking-[-0.03em] text-balance italic wrap-anywhere">
              {candidate.name}
            </h1>
            <div className="mt-3 sm:mt-4">
              <CandidateParty party={candidate.party} />
            </div>
          </header>
          {candidate.projects.length > 0 && (
            <section
              aria-labelledby="projects-heading"
              className={`order-4 min-w-0 border-t border-comelec-sage pt-4 motion-safe:[animation-delay:100ms] ${profileEntrance}`}
            >
              <h2
                id="projects-heading"
                className="font-display text-4xl leading-tight italic sm:text-5xl"
              >
                Advocacies and projects
              </h2>
              <ul className="mt-2 divide-y divide-comelec-sage border-b border-comelec-sage">
                {candidate.projects.map((project) => (
                  <li key={project.name} className="py-5 sm:py-6">
                    <h3 className="max-w-[34ch] font-editorial text-[clamp(1.5rem,2.25vw,2.125rem)] leading-tight text-balance wrap-anywhere">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-comelec-olive sm:text-lg">
                        {project.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-7">
          <CandidatePortrait
            candidate={candidate}
            sizes="(max-width: 40rem) 13rem, (max-width: 76rem) 28vw, 21rem"
            className={`order-2 max-w-52 sm:max-w-84 ${profileEntrance}`}
          />
          {(details.length > 0 || candidate.motto) && (
            <aside
              aria-label="Candidate details"
              className={`order-3 space-y-6 motion-safe:[animation-delay:55ms] ${profileEntrance}`}
            >
              <dl className="grid grid-cols-2 gap-x-5 gap-y-3 lg:grid-cols-1">
                {details.map(({ label, value }) => (
                  <div key={label} className="min-w-0 border-b border-comelec-sage/65 pb-2.5">
                    <dt className="text-sm text-comelec-olive">{label}</dt>
                    <dd className="mt-1 text-base leading-snug font-medium wrap-anywhere">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {candidate.motto && (
                <div className="border-l-2 border-comelec-sage bg-comelec-sage/20 px-4 py-3">
                  <p className="text-sm text-comelec-olive">Motto</p>
                  <blockquote className="mt-2 font-editorial text-2xl leading-snug italic">
                    {candidate.motto}
                  </blockquote>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      <div className="mt-7 border-b border-comelec-sage pb-4 sm:mt-9">
        <Suspense fallback={<div aria-hidden="true" className="min-h-12" />}>
          <CandidateProfileNavigation
            previousCandidate={previousCandidate}
            nextCandidate={nextCandidate}
          />
        </Suspense>
      </div>
    </article>
  )
}
