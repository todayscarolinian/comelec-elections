import { TRPCError } from '@trpc/server'
import prisma from '@/lib/prisma'
import { writeAudit } from '@/server/trpc/api/v1/audit/services/writeAudit'

export type GrantAdminInput = {
  email: string
  grantedBy: string
}

export type RevokeAdminInput = {
  email: string
  revokedBy: string
}

export async function grantAdmin({ email, grantedBy }: GrantAdminInput) {
  const adminEmail = email.trim().toLowerCase()

  return prisma.$transaction(async (tx) => {
    const admin = await tx.admin.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, grantedBy },
    })

    await writeAudit({ adminEmail: grantedBy, action: 'GRANT_ADMIN', target: adminEmail }, tx)

    return admin
  })
}

export async function revokeAdmin({ email, revokedBy }: RevokeAdminInput) {
  const adminEmail = email.trim().toLowerCase()

  await prisma.$transaction(
    async (tx) => {
      const existing = await tx.admin.findUnique({ where: { email: adminEmail } })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Admin not found' })
      }

      const count = await tx.admin.count()
      if (count <= 1) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot revoke the last Admin',
        })
      }

      // SAFE: the design requires removing the Admin row (no soft-delete flag on Admin); the revoke is recorded in AuditLog in this same transaction.
      await tx.admin.delete({ where: { email: adminEmail } })

      await writeAudit({ adminEmail: revokedBy, action: 'REVOKE_ADMIN', target: adminEmail }, tx)
    },
    { isolationLevel: 'Serializable' },
  )
}

export async function listAdmins() {
  return prisma.admin.findMany({
    orderBy: { email: 'asc' },
    select: { email: true, grantedBy: true, grantedAt: true },
  })
}
