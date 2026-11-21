'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { ballotAction, ballotHeading } from './ballot-styles'

const dialogId = 'ballot-sign-in'
const triggerId = 'ballot-sign-in-trigger'

function openDialog(trigger: HTMLElement | null) {
  const dialog = document.getElementById(dialogId)
  if (dialog instanceof HTMLDialogElement && !dialog.open) {
    trigger?.focus({ preventScroll: true })
    dialog.showModal()
  }
}

export function BallotSignInTrigger({
  children,
  className,
  id,
}: {
  children: ReactNode
  className: string
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      aria-haspopup="dialog"
      aria-controls={dialogId}
      onClick={(event) => openDialog(event.currentTarget)}
      className={className}
    >
      {children}
    </button>
  )
}

export function BallotEntryTrigger() {
  return (
    <BallotSignInTrigger className="inline-flex min-h-11 cursor-pointer items-center font-medium hover:underline hover:underline-offset-4">
      Ballot
    </BallotSignInTrigger>
  )
}

export function BallotSignIn() {
  useEffect(() => {
    openDialog(document.getElementById(triggerId))
  }, [])

  return (
    <div className="grow space-y-6 border-t border-comelec-sage py-12 sm:py-20">
      <h1 className={ballotHeading}>Ballot</h1>
      <BallotSignInTrigger id={triggerId} className={ballotAction}>
        Sign in
      </BallotSignInTrigger>
    </div>
  )
}

export function BallotSignInDialog() {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <dialog
      ref={dialog}
      id={dialogId}
      aria-labelledby={`${dialogId}-title`}
      aria-describedby={`${dialogId}-description`}
      closedby="any"
      className="election-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(calc(100%-2rem),30rem)] overflow-y-auto overscroll-contain border border-comelec-sage bg-comelec-cream p-6 text-comelec-forest shadow-[0_18px_44px_rgba(10,20,5,0.24)] sm:p-8"
    >
      <h2 id={`${dialogId}-title`} className="pe-10 font-display text-4xl leading-tight italic">
        Sign in to vote
      </h2>
      <p id={`${dialogId}-description`} className="mt-3 leading-relaxed text-comelec-olive">
        Use your USC Google account to open your ballot.
      </p>
      <GoogleSignInButton
        label="Continue with Google"
        redirectTo="/ballot"
        className={`${ballotAction} mt-6 w-full`}
      />
      <button
        type="button"
        aria-label="Close sign-in"
        onClick={() => dialog.current?.close()}
        className="absolute end-3 top-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-comelec-olive hover:bg-comelec-sage/35 hover:text-comelec-forest motion-safe:transition-colors motion-safe:duration-150"
      >
        <X aria-hidden="true" size={20} />
      </button>
    </dialog>
  )
}
