import prisma from '@/lib/prisma'
import { isDevToolsEnabled, parseDevEmail } from '@/server/dev/session'
import { ocrView } from '@/server/trpc/api/v1/registration/core/ocrView'

export async function GET(req: Request) {
  if (!isDevToolsEnabled()) {
    return new Response(null, { status: 404 })
  }

  const email = parseDevEmail(new URL(req.url).searchParams.get('email'))
  if (!email) {
    return Response.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const registration = await prisma.registration.findFirst({
    where: { person: { email } },
    select: {
      status: true,
      yearLevel: true,
      studentProfilePath: true,
      submittedAt: true,
      ocrStatus: true,
      ocrResult: true,
    },
  })

  if (!registration) {
    return Response.json({ registration: null })
  }

  return Response.json({
    registration: { ...registration, ocrStatus: ocrView(registration, new Date()) },
  })
}
