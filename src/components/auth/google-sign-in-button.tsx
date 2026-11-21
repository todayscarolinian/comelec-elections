'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

type GoogleSignInButtonProps = {
  label: string
  className: string
  redirectTo?: '/' | '/register'
}

export function GoogleSignInButton({
  label,
  className,
  redirectTo = '/register',
}: Readonly<GoogleSignInButtonProps>) {
  const [isSigningIn, setIsSigningIn] = useState(false)

  return (
    <button
      type="button"
      className={className}
      disabled={isSigningIn}
      onClick={() => {
        setIsSigningIn(true)
        void signIn('google', { redirectTo }).catch(() => setIsSigningIn(false))
      }}
    >
      {isSigningIn ? 'Redirecting to Google…' : label}
    </button>
  )
}
