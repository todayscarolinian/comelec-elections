import type { Metadata } from 'next'
import { ElectionResultsPage } from '@/components/results/election-results-page'
import { SAMPLE_RESULTS } from '@/components/results/sample-results'

export const metadata: Metadata = {
  title: 'Election Results Sample',
  description: 'Preview of published SSC election results using sample data.',
  robots: { index: false, follow: false },
}

export default function ResultsSamplePage() {
  return <ElectionResultsPage results={SAMPLE_RESULTS} sample />
}
