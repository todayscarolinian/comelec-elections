import 'server-only'
import prisma from '@/lib/prisma'
import { auth } from './index'
import { normalizeEmail } from './policy'

export type AdminAccess =
  { status: 'SIGNED_OUT' } | { status: 'NOT_ADMIN' } | { status: 'ADMIN'; email: string }

// Route-level check for Admin pages. Procedures still enforce adminProcedure on every call.
export async function getAdminAccess(): Promise<AdminAccess> {
  const session = await auth()
  if (!session) return { status: 'SIGNED_OUT' }

  const admin = await prisma.admin.findUnique({
    where: { email: normalizeEmail(session.user.email) },
    select: { email: true },
  })
  return admin ? { status: 'ADMIN', email: admin.email } : { status: 'NOT_ADMIN' }
}
