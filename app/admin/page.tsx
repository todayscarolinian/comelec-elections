import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/admin/dashboard/admin-dashboard'

export const metadata: Metadata = {
  title: 'Admin dashboard',
  description: 'Election status, registration queue and recent admin activity.',
}

export default function AdminDashboardPage() {
  return <AdminDashboard />
}
