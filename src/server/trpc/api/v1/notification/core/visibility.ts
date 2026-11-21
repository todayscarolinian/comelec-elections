import type { Prisma } from '@/generated/prisma/client'

export type Reader = { id: string; createdAt: Date }

/** A Person sees their own notifications and every broadcast. */
export function visibleTo(personId: string): Prisma.NotificationWhereInput {
  return { OR: [{ personId }, { personId: null }] }
}

/**
 * Unread = visible, no read receipt, and not a broadcast from before the Person signed up.
 * Older broadcasts still show in the list (as read) so late sign-ups see the Election's
 * state without a pile of unread badges on first sign-in.
 */
export function unreadBy(reader: Reader): Prisma.NotificationWhereInput {
  return {
    reads: { none: { personId: reader.id } },
    OR: [{ personId: reader.id }, { personId: null, createdAt: { gte: reader.createdAt } }],
  }
}

export function isRead(
  notification: { personId: string | null; createdAt: Date; hasReceipt: boolean },
  reader: Reader,
) {
  if (notification.hasReceipt) return true
  return notification.personId === null && notification.createdAt < reader.createdAt
}
