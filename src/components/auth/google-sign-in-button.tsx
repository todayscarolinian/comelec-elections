'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

type GoogleSignInButtonProps = {
  label: string
  className: string
}

export function GoogleSignInButton({ label, className }: Readonly<GoogleSignInButtonProps>) {
  const [isSigningIn, setIsSigningIn] = useState(false)

  return (
    <button
      type="button"
      className={className}
      disabled={isSigningIn}
      onClick={() => {
        setIsSigningIn(true)
        void signIn('google', { redirectTo: '/register' }).catch(() => setIsSigningIn(false))
      }}
    >
      {isSigningIn ? 'Redirecting to Google…' : label}
    </button>
  )
}
