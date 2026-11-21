import { TRPCError } from '@trpc/server'
import { Suspense } from 'react'
import { ElectionResultsPage } from '@/components/results/election-results-page'
import { ResultsPageSkeleton } from '@/components/results/results-skeleton'
import { pageMetadata } from '@/lib/site'
import { caller } from '@/server/trpc/server'

export const metadata = pageMetadata({
  title: 'Election Results',
  description: 'Check the release status of the 2026 SSC General Elections results.',
  path: '/results',
})

async function ReleasedOrPending() {
  // FORBIDDEN means Results are not released yet; anything else is a real failure.
  const results = await caller.results.get({ audience: 'public' }).catch((error: unknown) => {
    if (error instanceof TRPCError && error.code === 'FORBIDDEN') return null
    throw error
  })
  return <ElectionResultsPage results={results} />
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsPageSkeleton />}>
      <ReleasedOrPending />
    </Suspense>
  )
}
