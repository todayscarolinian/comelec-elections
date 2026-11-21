import { ArrowLeft, CircleAlert, UserRoundX } from 'lucide-react'
import Link from 'next/link'
import {
  registrationAction,
  registrationHeading,
  registrationPanel,
  registrationPanelEntrance,
  registrationTextButton,
} from '@/components/registration/registration-styles'
import { normalizeHostedDomain } from '@/server/auth/policy'
import { GoogleSignInButton } from './google-sign-in-button'

export function AuthErrorMessage({
  error,
  allowedDomain,
}: Readonly<{ error?: string; allowedDomain?: string }>) {
  const domain = normalizeHostedDomain(allowedDomain)
  const configurationError = !domain || error === 'Configuration'
  const accessDenied = error === 'AccessDenied' && !configurationError
  const temporarilyUnavailable = error === 'SignInUnavailable' && !configurationError
  const heading = configurationError
    ? 'Sign-in unavailable'
    : accessDenied
      ? 'Use your university account.'
      : temporarilyUnavailable
        ? 'Please try again shortly.'
        : 'Unable to sign in'
  const message = configurationError
    ? 'Organization sign-in is not configured. Contact the election administrator.'
    : accessDenied
      ? `Only @${domain} Google Workspace accounts can sign in.`
      : temporarilyUnavailable
        ? 'Sign-in is temporarily unavailable. Please try again in a moment.'
        : 'We could not complete your Google sign-in. Please try again.'
  const ErrorIcon = accessDenied ? UserRoundX : CircleAlert

  return (
    <section
      aria-labelledby="auth-error-heading"
      className={`${registrationPanel} ${registrationPanelEntrance} [&>*]:max-w-[35rem]`}
    >
      <div
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-full border border-comelec-sage bg-comelec-sage/20 text-comelec-forest"
      >
        <ErrorIcon size={26} strokeWidth={1.5} />
      </div>
      <header className="space-y-4">
        <p className="text-xs font-medium tracking-[0.08em] text-comelec-olive uppercase">
          Sign-in not completed
        </p>
        <h1
          id="auth-error-heading"
          className={`${registrationHeading} text-[clamp(2.75rem,3.9vw,3.5rem)] min-[56rem]:text-[clamp(3rem,4.45vw,4rem)]`}
        >
          {heading}
        </h1>
        <p className="text-base leading-relaxed text-[#56654a] sm:text-lg">{message}</p>
      </header>

      {accessDenied && (
        <p className="text-sm leading-relaxed text-[#56654a]">
          Please choose your university account in the Google account picker to continue. Personal
          Google accounts cannot be used for this election.
        </p>
      )}

      {!configurationError && (
        <GoogleSignInButton
          label={accessDenied ? 'Choose another Google account' : 'Try Google sign-in again'}
          redirectTo="/auth/sign-in"
          className={`${registrationAction} w-full cursor-pointer motion-safe:transition-[background-color,scale] motion-safe:duration-150 motion-safe:active:scale-[0.99]`}
        />
      )}

      <div className="border-t border-comelec-sage pt-3">
        <Link href="/" className={registrationTextButton}>
          <ArrowLeft aria-hidden="true" className="me-2 size-4 shrink-0" />
          Back to home
        </Link>
      </div>
    </section>
  )
}
