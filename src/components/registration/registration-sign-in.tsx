import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import {
  registrationAction,
  registrationHeading,
  registrationPanel,
  registrationPanelEntrance,
  registrationTextButton,
} from './registration-styles'

export function RegistrationSignIn({
  returnTo = '/',
  redirectTo = '/register',
}: {
  returnTo?: '/' | '/register' | '/ballot'
  redirectTo?: '/auth/sign-in' | '/register' | '/ballot'
}) {
  return (
    <div className={`${registrationPanel} ${registrationPanelEntrance} [&>*]:max-w-[35rem]`}>
      <header className="space-y-4" aria-live="polite">
        <h1
          className={`${registrationHeading} text-[clamp(2.75rem,3.9vw,3.5rem)] min-[56rem]:text-[clamp(3rem,4.45vw,4rem)]`}
        >
          Make your
          <br />
          voice count.
        </h1>
        <p className="text-base leading-relaxed text-[#56654a] sm:text-lg">
          Sign in with your USC email account through Google to register for the election.
        </p>
      </header>
      <GoogleSignInButton
        label="Continue with Google"
        redirectTo={redirectTo}
        className={`${registrationAction} w-full cursor-pointer motion-safe:transition-[background-color,scale] motion-safe:duration-150 motion-safe:active:scale-[0.99]`}
      />
      <p className="text-sm leading-relaxed text-[#56654a]">
        Have your year level and current Student Profile ready.
      </p>
      <div className="border-t border-[#b6c89f] pt-3">
        <Link href={returnTo} className={registrationTextButton}>
          <ArrowLeft aria-hidden="true" className="me-2 size-4 shrink-0" />
          {returnTo === '/ballot'
            ? 'Back to ballot'
            : returnTo === '/register'
              ? 'Back to registration'
              : 'Back to home'}
        </Link>
      </div>
    </div>
  )
}
