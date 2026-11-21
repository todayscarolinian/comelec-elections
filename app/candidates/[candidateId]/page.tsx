import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CandidateProfile } from '@/components/candidates/candidate-profile'
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
    description: `Meet ${candidate.name}, candidate for ${candidate.officeTitle}. Explore their platform and commitments.`,
  }
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const { candidateId } = await params
  const index = CANDIDATES.findIndex((candidate) => candidate.id === candidateId)
  if (index === -1) notFound()

  return (
    <div className="mx-auto w-full max-w-[1440px] px-[clamp(1rem,4.5vw,4rem)] pb-12 pt-6 sm:pt-8">
      <CandidateProfile candidate={CANDIDATES[index]} nextCandidate={CANDIDATES[index + 1]} />
    </div>
  )
}
