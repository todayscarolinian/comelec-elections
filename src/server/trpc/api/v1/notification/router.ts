import { markAllRead } from '@/server/trpc/api/v1/notification/core/mutations/markAllRead'
import { markRead } from '@/server/trpc/api/v1/notification/core/mutations/markRead'
import { list } from '@/server/trpc/api/v1/notification/core/queries/list'
import { createTRPCRouter } from '@/server/trpc/init'

export const notificationRouter = createTRPCRouter({
  list,
  markRead,
  markAllRead,
})
