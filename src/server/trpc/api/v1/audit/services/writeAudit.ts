import type { AuditAction } from '@/server/trpc/api/v1/audit/schema'
import prisma from '@/lib/prisma'
import type { InputJsonValue } from '@/generated/prisma/internal/prismaNamespace'

export type AuditDetails = {
  adminEmail: string
  action: AuditAction
  target?: string
  detail?: InputJsonValue
}

export async function writeAudit({ adminEmail, action, target, detail }: AuditDetails) {
  return prisma.auditLog.create({
    data: {
      adminEmail: adminEmail.trim().toLowerCase(),
      action,
      target,
      detail,
    },
  })
}
