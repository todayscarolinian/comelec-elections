import { connection } from 'next/server'
import { getCachedTurnout } from '@/server/turnout'

// Public and outside tRPC so every visitor shares one cached snapshot (ADR 0007, Design §7.1).
export async function GET() {
  // Request time only: never prerender Turnout at build time or query the database during
  // `next build`. Kept outside the try so Next.js can handle its prerender signal.
  await connection()

  try {
    const { electionStatus, ballotsCast, approvedVoters } = await getCachedTurnout()

    return Response.json({ electionStatus, ballotsCast, approvedVoters })
  } catch (error) {
    // The Prisma `name`/`code` are logged inside getCachedTurnout, before the cache boundary
    // strips them. The digest matches Next.js's own log of this error.
    const { digest } = (error ?? {}) as { digest?: string }
    console.error('Turnout request failed', { digest })

    return Response.json(
      { error: 'Turnout is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
