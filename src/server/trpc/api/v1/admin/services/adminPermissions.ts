import { TRPCError } from '@trpc/server'
import { normalizeEmail } from '@/server/auth/policy'
import type { Db } from '@/server/trpc/init'

export type GrantAdminInput = {
  email: string
  grantedBy: string
}

export type RevokeAdminInput = {
  email: string
  revokedBy: string
}

export async function grantAdmin(db: Db, { email, grantedBy }: GrantAdminInput) {
  const adminEmail = normalizeEmail(email)

  return db.$transaction(async (tx) => {
    const admin = await tx.admin.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, grantedBy },
    })
    return admin
  })
}

export async function revokeAdmin(db: Db, { email }: RevokeAdminInput) {
  const adminEmail = normalizeEmail(email)

  await db.$transaction(
    async (tx) => {
      const existing = await tx.admin.findUnique({ where: { email: adminEmail } })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Admin not found' })

      const count = await tx.admin.count()
      if (count <= 1) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot revoke the last Admin',
        })
      }

      // SAFE: the design requires an admin hard delete
      await tx.admin.delete({ where: { email: adminEmail } })
    },
    { isolationLevel: 'Serializable' },
  )
}

export async function listAdmins(db: Db) {
  return db.admin.findMany({
    orderBy: { email: 'asc' },
    select: { email: true, grantedBy: true, grantedAt: true },
  })
}
