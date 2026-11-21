import type { Metadata } from 'next'
import { BallotAudit } from '@/components/admin/ballots/ballot-audit'

export const metadata: Metadata = {
  title: 'Ballot audit',
  description: 'Audit and export cast ballots.',
}

export default function BallotAuditPage() {
  return <BallotAudit />
}
