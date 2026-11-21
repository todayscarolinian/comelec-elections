import { ElectionResultsPage } from '@/components/results/election-results-page'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Election Results',
  description: 'Check the release status of the 2026 SSC General Elections results.',
  path: '/results',
})

export default function ResultsPage() {
  return <ElectionResultsPage />
}
