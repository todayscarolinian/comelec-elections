import type { Metadata } from 'next'
import { ElectionResultsPage } from '@/components/results/election-results-page'

export const metadata: Metadata = {
  title: 'Election Results Sample | SSC COMELEC',
  description: 'Preview of published SSC election results using sample data.',
}

export default function ResultsSamplePage() {
  return <ElectionResultsPage released />
}
