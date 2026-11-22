import type { Prisma } from '@/generated/prisma/client'
import type { NotificationType } from '@/generated/prisma/enums'
import type { NotificationData } from '@/server/trpc/api/v1/notification/schema'

type NotificationClient = {
  notification: Pick<Prisma.TransactionClient['notification'], 'create'>
}

// Pass the transaction client so the notification commits (or rolls back) with its change.
export function notifyPerson(
  client: NotificationClient,
  personId: string,
  type: NotificationType,
  data?: NotificationData,
) {
  return client.notification.create({ data: { personId, type, data }, select: { id: true } })
}

/** One broadcast row for every signed-in Person; read state is kept per Person. */
export function notifyEveryone(
  client: NotificationClient,
  type: NotificationType,
  data?: NotificationData,
) {
  return client.notification.create({ data: { personId: null, type, data }, select: { id: true } })
}
