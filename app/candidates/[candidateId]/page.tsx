import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CandidateProfile } from '@/components/candidates/candidate-profile'
import { electionContent } from '@/components/election/election-styles'
import { CANDIDATES } from '@/lib/candidates'

type CandidatePageProps = { params: Promise<{ candidateId: string }> }

export function generateStaticParams() {
  return CANDIDATES.map((candidate) => ({ candidateId: candidate.id }))
}

export async function generateMetadata({ params }: CandidatePageProps): Promise<Metadata> {
  const { candidateId } = await params
  const candidate = CANDIDATES.find((item) => item.id === candidateId)
  if (!candidate) return { title: 'Candidate not found' }
  return {
    title: candidate.name,
    description: `Meet ${candidate.name}. Read their profile, advocacies, and projects.`,
  }
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { candidateId } = await params
  const index = CANDIDATES.findIndex((candidate) => candidate.id === candidateId)
  if (index === -1) notFound()

  return (
    <div className={`${electionContent} pb-12 pt-6 sm:pt-8`}>
      <CandidateProfile
        candidate={CANDIDATES[index]}
        previousCandidate={CANDIDATES[index - 1]}
        nextCandidate={CANDIDATES[index + 1]}
      />
    </div>
  )
}
