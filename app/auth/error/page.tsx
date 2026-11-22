import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthErrorMessage } from '@/components/auth/auth-error-message'
import { RegistrationShell } from '@/components/registration/registration-shell'
import { SignInPanelSkeleton } from '@/components/registration/registration-skeletons'
import { allowedHostedDomain } from '@/server/auth'

export const metadata: Metadata = {
  title: 'Sign-in error',
  description: 'Get help signing in to SSC Elections with your university Google account.',
  robots: { index: false, follow: false },
}

type ErrorPageProps = {
  searchParams: Promise<{ error?: string | string[] }>
}

async function ErrorContent({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams
  return (
    <AuthErrorMessage
      error={typeof error === 'string' ? error : undefined}
      allowedDomain={allowedHostedDomain}
    />
  )
}

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  return (
    <RegistrationShell signInPage>
      <Suspense fallback={<SignInPanelSkeleton label="Loading sign-in details…" />}>
        <ErrorContent searchParams={searchParams} />
      </Suspense>
    </RegistrationShell>
  )
}
