import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AdminAccountPanel } from '@/components/admin/admin-account-panel'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminAccess } from '@/server/auth/admin'

async function AdminAccount() {
  const access = await getAdminAccess()
  if (access.status === 'SIGNED_OUT') redirect('/auth/sign-in')
  if (access.status === 'NOT_ADMIN') redirect('/')
  return <AdminAccountPanel email={access.email} />
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminShell
      account={
        <Suspense fallback={<AdminAccountPanel email={null} />}>
          <AdminAccount />
        </Suspense>
      }
    >
      {children}
    </AdminShell>
  )
}
