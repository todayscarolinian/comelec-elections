import { TRPCError } from '@trpc/server'
import { normalizeEmail } from '@/server/auth/policy'
import type { Db } from '@/server/trpc/init'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'

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
    // Skip duplicates so re-granting keeps the original grant and writes no audit row.
    const { count } = await tx.admin.createMany({
      data: { email: adminEmail, grantedBy },
      skipDuplicates: true,
    })

    if (count === 1) {
      await writeAudit({ adminEmail: grantedBy, action: 'GRANT_ADMIN', target: adminEmail }, tx)
    }

    return { email: adminEmail }
  })
}

export async function revokeAdmin(db: Db, { email, revokedBy }: RevokeAdminInput) {
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

      await writeAudit({ adminEmail: revokedBy, action: 'REVOKE_ADMIN', target: adminEmail }, tx)
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
