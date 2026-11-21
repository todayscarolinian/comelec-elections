import type { Metadata } from 'next'
import { AdminManagement } from '@/components/admin/admins/admin-management'

export const metadata: Metadata = {
  title: 'Admins',
  description: 'Grant or revoke admin access.',
}

export default function AdminsPage() {
  return <AdminManagement />
}
