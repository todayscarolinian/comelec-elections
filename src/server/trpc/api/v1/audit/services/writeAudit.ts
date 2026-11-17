import type { AuditAction } from '@/server/trpc/api/v1/audit/schema'
import prisma from '@/lib/prisma'
import type { InputJsonValue } from '@/generated/prisma/internal/prismaNamespace'
import type { Prisma } from '@/generated/prisma/client'

export type AuditDetails = {
  adminEmail: string
  action: AuditAction
  target?: string
  detail?: InputJsonValue
}

type AuditClient = {
  auditLog: Pick<Prisma.TransactionClient['auditLog'], 'create'>
}

// Pass the transaction client when auditing a write so both changes commit together.
export async function writeAudit(
  { adminEmail, action, target, detail }: AuditDetails,
  client: AuditClient = prisma,
) {
  return client.auditLog.create({
    data: {
      adminEmail: adminEmail.trim().toLowerCase(),
      action,
      target,
      detail,
    },
  })
}
