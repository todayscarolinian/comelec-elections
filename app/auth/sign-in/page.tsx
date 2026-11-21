import { X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { registrationAction } from '@/components/registration/registration-styles'
import { auth } from '@/server/auth'

export const metadata: Metadata = {
  title: 'Sign in | SSC COMELEC Elections',
  description: 'Sign in to SSC Elections using your USC Google account.',
}

type SignInPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

async function SignInContent({ searchParams }: SignInPageProps) {
  const { next } = await searchParams
  const returnTo = next === '/register' ? '/register' : '/'
  if (await auth()) redirect(returnTo)

  return (
    <section
      aria-labelledby="sign-in-heading"
      className="relative w-full max-w-[452px] space-y-5 rounded-lg border border-comelec-sage bg-comelec-cream p-6 shadow-[0_12px_32px_rgba(10,20,5,0.2)] motion-safe:animate-[election-page-in_220ms_ease-out_both] sm:p-8"
    >
      <header className="space-y-3">
        <h1 id="sign-in-heading" className="pe-11 font-display text-5xl leading-[1.12] italic">
          Sign in
        </h1>
        <p className="text-base leading-relaxed text-comelec-olive">
          Continue with Google using your USC email account.
        </p>
      </header>
      <Link
        href={returnTo}
        aria-label="Close sign-in"
        className="absolute end-5 top-5 inline-flex size-11 items-center justify-center rounded-full hover:bg-comelec-sage/35"
      >
        <X aria-hidden="true" size={20} />
      </Link>
      <GoogleSignInButton
        label="Continue with Google"
        redirectTo={returnTo}
        className={`${registrationAction} w-full cursor-pointer motion-safe:transition-colors`}
      />
      <div className="flex justify-center">
        <Link
          href={returnTo}
          className="inline-flex min-h-11 items-center px-4 text-sm font-medium hover:underline hover:underline-offset-4"
        >
          Cancel
        </Link>
      </div>
    </section>
  )
}

export default function SignInPage(props: SignInPageProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-[#d8e9bd] bg-[linear-gradient(rgb(23_41_14/54%),rgb(23_41_14/54%)),url('/landing/hero.webp')] bg-cover bg-center px-4 py-8 text-comelec-forest [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4">
      <Suspense fallback={<output className="text-comelec-cream">Loading sign-in…</output>}>
        <SignInContent {...props} />
      </Suspense>
    </main>
  )
}
