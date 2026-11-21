import { CANDIDATES, CANDIDATE_OFFICES, type DirectoryCandidate } from '@/lib/candidates'
import { CandidateCard } from './candidate-card'

export const candidateGalleryBackdrop =
  "[--candidate-grid-wash:color-mix(in_srgb,var(--color-comelec-cream)_50%,transparent)] bg-comelec-cream bg-[linear-gradient(var(--candidate-grid-wash),var(--candidate-grid-wash)),url('/landing/gallery.webp')] bg-top bg-size-[100%_100%,min(100%,100rem)_auto]"

export const candidateGalleryIntro =
  'flex items-center justify-between gap-6 max-[38rem]:flex-col max-[38rem]:items-start'

export const candidateGalleryDescription =
  'max-w-[22.2rem] text-[clamp(1rem,1.4vw,1.25rem)] leading-[1.12] text-comelec-olive'

export function CandidateOfficeGrid({
  candidates = CANDIDATES,
  query = '',
  preview = false,
}: {
  candidates?: readonly DirectoryCandidate[]
  query?: string
  preview?: boolean
}) {
  const OfficeHeading = preview ? 'h3' : 'h2'

  return (
    <div className="grid gap-x-4 gap-y-10 min-[38.01rem]:grid-cols-2">
      {CANDIDATE_OFFICES.map((office, index) => {
        const group = candidates.filter((candidate) => candidate.officeId === office.id)
        if (!group.length) return null

        const wide = index >= 2
        const cards = preview ? group.slice(0, wide ? 4 : 2) : group
        const columns = wide ? 'min-[38.01rem]:grid-cols-2 lg:grid-cols-4' : 'lg:grid-cols-2'
        return (
          <section
            key={office.id}
            aria-labelledby={`office-${office.id}`}
            className={wide ? 'col-span-full' : undefined}
          >
            <div className="flex items-baseline justify-between gap-2">
              <OfficeHeading
                id={`office-${office.id}`}
                className="text-xl leading-tight italic [font-family:var(--landing-fraunces),Georgia,serif]"
              >
                {office.title}
              </OfficeHeading>
              <span className="text-right text-xs text-comelec-olive">
                {group.length} {group.length === 1 ? 'candidate' : 'candidates'}
              </span>
            </div>
            <ul className={`mt-4 grid gap-4 ${columns}`}>
              {cards.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  heading={preview ? 'h4' : 'h3'}
                  query={query}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
