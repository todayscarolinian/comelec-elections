import { z } from 'zod'
import { NotificationType } from '@/generated/prisma/enums'

/** Display parameters only. Never put Ballot choices or Ballot ids here. */
export const notificationDataSchema = z.object({
  rejectionReason: z.string().optional(),
  held: z.boolean().optional(),
  votingOpen: z.boolean().optional(),
})
export type NotificationData = z.infer<typeof notificationDataSchema>

export const listInputSchema = z
  .object({ limit: z.number().int().min(1).max(50).default(20) })
  .default({ limit: 20 })

export const markReadInputSchema = z.object({ ids: z.array(z.uuid()).min(1).max(50) })

export const notificationItemSchema = z.object({
  id: z.string(),
  type: z.enum(NotificationType),
  data: notificationDataSchema.nullable(),
  createdAt: z.date(),
  read: z.boolean(),
})

export const listOutputSchema = z.object({
  items: z.array(notificationItemSchema),
  unreadCount: z.number().int().nonnegative(),
})

export const markReadOutputSchema = z.object({ count: z.number().int().nonnegative() })
