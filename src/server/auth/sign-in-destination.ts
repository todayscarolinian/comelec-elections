import 'server-only'
import prisma from '@/lib/prisma'

export async function getSignInDestination(
  personId: string,
  returnTo: '/' | '/register',
): Promise<'/' | '/register'> {
  if (returnTo === '/register') return '/register'

  // If the lookup fails, Registration can show the voter its retry state.
  const registration = await prisma.registration
    .findUnique({ where: { personId }, select: { id: true } })
    .catch(() => null)

  return registration ? '/' : '/register'
}
