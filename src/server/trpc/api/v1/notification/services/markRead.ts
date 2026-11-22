import type { Db } from '@/server/trpc/init'
import { unreadBy, visibleTo, type Reader } from '../core/visibility'

async function writeReceipts(db: Db, personId: string, ids: string[]) {
  if (ids.length === 0) return { count: 0 }
  return db.notificationRead.createMany({
    data: ids.map((notificationId) => ({ notificationId, personId })),
    skipDuplicates: true,
  })
}

/** Ignores ids the Person cannot see, so receipts never touch another Person's notices. */
export async function markRead(db: Db, reader: Reader, ids: string[]) {
  const visible = await db.notification.findMany({
    where: { AND: [{ id: { in: ids } }, visibleTo(reader.id)] },
    select: { id: true },
  })
  return writeReceipts(
    db,
    reader.id,
    visible.map(({ id }) => id),
  )
}

export async function markAllRead(db: Db, reader: Reader) {
  const unread = await db.notification.findMany({ where: unreadBy(reader), select: { id: true } })
  return writeReceipts(
    db,
    reader.id,
    unread.map(({ id }) => id),
  )
}
