import type { z } from 'zod'
import type { Db } from '@/server/trpc/init'
import type { listAuditLogInputSchema } from '../schema'

export const AUDIT_PAGE_SIZE = 50

export async function listAuditLog(db: Db, input: z.infer<typeof listAuditLogInputSchema>) {
  const records = await db.auditLog.findMany({
    where: { action: input.action },
    orderBy: [{ at: 'desc' }, { id: 'desc' }],
    take: AUDIT_PAGE_SIZE + 1,
    ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
    select: { id: true, adminEmail: true, action: true, target: true, detail: true, at: true },
  })
  const items = records.slice(0, AUDIT_PAGE_SIZE)
  return {
    items,
    nextCursor: records.length > AUDIT_PAGE_SIZE ? (items.at(-1)?.id ?? null) : null,
  }
}
