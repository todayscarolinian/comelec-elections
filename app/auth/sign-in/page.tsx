import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { RegistrationShell } from '@/components/registration/registration-shell'
import { RegistrationSignIn } from '@/components/registration/registration-sign-in'
import { registrationPanel } from '@/components/registration/registration-styles'
import { auth } from '@/server/auth'
import { getSignInDestination } from '@/server/auth/sign-in-destination'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to SSC Elections using your USC Google account.',
}

type SignInPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

async function SignInContent({ searchParams }: SignInPageProps) {
  const { next } = await searchParams
  const returnTo = next === '/register' || next === '/ballot' ? next : '/'
  const session = await auth()
  if (session) redirect(await getSignInDestination(session.user.personId, returnTo))

  return (
    <RegistrationSignIn
      returnTo={returnTo}
      redirectTo={returnTo === '/' ? '/auth/sign-in' : returnTo}
    />
  )
}

export default function SignInPage(props: SignInPageProps) {
  return (
    <RegistrationShell signInPage>
      <Suspense fallback={<output className={registrationPanel}>Loading sign-in…</output>}>
        <SignInContent {...props} />
      </Suspense>
    </RegistrationShell>
  )
}
