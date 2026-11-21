import type { Metadata } from 'next'
import { AdminResults } from '@/components/admin/results/admin-results'

export const metadata: Metadata = {
  title: 'Admin results',
  description: 'Review private results and release them.',
}

export default function AdminResultsPage() {
  return <AdminResults />
}
