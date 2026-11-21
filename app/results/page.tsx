import type { Metadata } from 'next'
import { ElectionResultsPage } from '@/components/results/election-results-page'

export const metadata: Metadata = {
  title: 'Election Results | SSC COMELEC',
  description: 'Check the release status of the 2026 SSC General Elections results.',
}

export default function ResultsPage() {
  return <ElectionResultsPage />
}
