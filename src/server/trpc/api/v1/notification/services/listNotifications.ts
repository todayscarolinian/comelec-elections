import type { Db } from '@/server/trpc/init'
import { isRead, unreadBy, visibleTo, type Reader } from '../core/visibility'
import { notificationDataSchema } from '../schema'

export async function listNotifications(db: Db, reader: Reader, limit: number) {
  const [rows, unreadCount] = await db.$transaction([
    db.notification.findMany({
      where: visibleTo(reader.id),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        personId: true,
        type: true,
        data: true,
        createdAt: true,
        reads: { where: { personId: reader.id }, select: { readAt: true }, take: 1 },
      },
    }),
    db.notification.count({ where: unreadBy(reader) }),
  ])

  return {
    items: rows.map(({ reads, personId, data, ...row }) => {
      const parsed = notificationDataSchema.safeParse(data)
      return {
        ...row,
        data: parsed.success ? parsed.data : null,
        read: isRead({ personId, createdAt: row.createdAt, hasReceipt: reads.length > 0 }, reader),
      }
    }),
    unreadCount,
  }
}
