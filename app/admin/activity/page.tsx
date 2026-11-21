import type { Metadata } from 'next'
import { ActivityLog } from '@/components/admin/activity/activity-log'

export const metadata: Metadata = {
  title: 'Activity log',
  description: 'Every recorded admin action.',
}

export default function ActivityLogPage() {
  return <ActivityLog />
}
