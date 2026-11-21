import { publicProcedure } from '@/server/trpc/init'

export const ping = publicProcedure.query(() => ({ ok: true as const }))
