import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthErrorMessage } from '@/components/auth/auth-error-message'
import { allowedHostedDomain } from '@/server/auth'

export const metadata: Metadata = {
  title: 'Sign-in error',
  description: 'Why your sign-in to the SSC Elections did not complete.',
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
    <Suspense fallback={<output className="p-6">Loading sign-in details…</output>}>
      <ErrorContent searchParams={searchParams} />
    </Suspense>
  )
}
