import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/server/trpc/init'
import { isAllowedOrigin } from '@/server/trpc/origin'
import { appRouter } from '@/server/trpc/root'

export const maxDuration = 300

const handler = (req: Request) => {
  if (!isAllowedOrigin(req, process.env.AUTH_URL)) {
    return Response.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  })
}

export { handler as GET, handler as POST }
