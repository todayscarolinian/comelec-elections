import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import prisma from '@/lib/prisma'
import { createDevSession, isDevEnvironment } from '@/server/dev/session'
import { isAllowedOrigin } from '@/server/trpc/origin'
import { appRouter } from '@/server/trpc/root'

export const maxDuration = 300

const handler = (req: Request) => {
  if (!isDevEnvironment()) {
    return new Response(null, { status: 404 })
  }

  if (!isAllowedOrigin(req, process.env.AUTH_URL)) {
    return Response.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  return fetchRequestHandler({
    endpoint: '/api/dev/trpc',
    req,
    router: appRouter,
    createContext: async () => ({
      headers: req.headers,
      session: await createDevSession(req.headers),
      db: prisma,
    }),
  })
}

export { handler as GET, handler as POST }
