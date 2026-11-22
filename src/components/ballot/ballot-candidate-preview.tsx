import { ArrowUpRight, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { CandidatePortrait } from '@/components/candidates/candidate-portrait'
import type { CandidateDef } from '@/election'
import { CANDIDATES, candidateHref } from '@/lib/candidates'
import { ballotTextAction } from './ballot-styles'

export function BallotCandidatePreview({
  candidate,
  office,
  onClose,
}: {
  candidate: CandidateDef
  office: string
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const profile = CANDIDATES.find(({ id }) => id === (candidate.profileId ?? candidate.id))
  const highlights = profile?.platformHighlights ?? profile?.projects.map(({ name }) => name)
  const academics = [profile?.school, profile?.program, profile?.year && `Year ${profile.year}`]
    .filter(Boolean)
    .join(' · ')
  const traits = [
    profile?.personalTrait && `${profile.personalTrait} as a person`,
    profile?.leadershipTrait && `${profile.leadershipTrait} as a leader`,
  ]
    .filter(Boolean)
    .join(' · ')
  const officeDetails = [
    office,
    profile && `Ballot #${profile.number}`,
    candidate.party ?? 'Independent',
  ]
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="ballot-candidate-name"
      onClose={onClose}
      closedby="any"
      className="election-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(calc(100%-2rem),25rem)] max-w-none overflow-y-auto overscroll-contain border border-comelec-sage bg-comelec-cream px-5 py-4 text-comelec-forest shadow-[0_16px_40px_rgba(13,20,6,0.22)] md:w-[min(calc(100%-3rem),51.75rem)] md:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3 md:border-b md:border-comelec-sage md:pb-3.5">
        <p className="font-editorial text-2xl leading-tight italic">Candidate preview</p>
        <button
          type="button"
          aria-label="Close candidate preview"
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center hover:bg-comelec-sage/35"
          onClick={() => dialog.current?.close()}
        >
          <X aria-hidden="true" size={24} />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:items-center md:gap-8">
        <CandidatePortrait
          candidate={candidate.photo ? candidate : (profile ?? candidate)}
          sizes="(min-width: 768px) 360px, (min-width: 432px) 358px, calc(100vw - 74px)"
          className="border border-comelec-sage"
          plainPlaceholder
        />
        <div className="min-w-0 space-y-3 wrap-anywhere md:space-y-4">
          <div className="space-y-1 text-[0.8125rem] leading-[1.125rem] text-comelec-olive md:space-y-1.5">
            <h2
              id="ballot-candidate-name"
              className="font-editorial text-[1.375rem] leading-tight font-bold text-comelec-forest md:text-[1.75rem]"
            >
              {candidate.name}
            </h2>
            <p>{officeDetails}</p>
            {academics && <p>{academics}</p>}
            {traits && <p className="first-letter:uppercase">{traits}</p>}
          </div>
          {profile?.motto && (
            <blockquote className="font-display text-xl italic">“{profile.motto}”</blockquote>
          )}
          {highlights?.length ? (
            <section
              aria-labelledby="ballot-candidate-highlights"
              className="space-y-1.5 border-t border-comelec-sage pt-3 text-sm md:border-0 md:pt-0"
            >
              <h3 id="ballot-candidate-highlights" className="font-medium">
                Platform highlights
              </h3>
              <ul className="list-disc space-y-1 ps-4 text-comelec-olive">
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          ) : (
            candidate.bio && <p className="text-sm text-comelec-olive">{candidate.bio}</p>
          )}
          {profile && (
            <Link
              href={candidateHref(profile.id)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ballotTextAction} underline underline-offset-4`}
            >
              View full profile <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          )}
        </div>
      </div>
    </dialog>
  )
}
