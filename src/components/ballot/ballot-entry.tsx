import Link from 'next/link'
import { Suspense, cache, type ReactNode } from 'react'
import { auth } from '@/server/auth'
import { BallotSignInTrigger } from './ballot-sign-in'

const getSession = cache(() => auth())

type BallotEntryProps = { children?: ReactNode; className?: string }

async function SessionBallotEntry({
  children,
  className,
  fallback,
}: BallotEntryProps & { fallback: ReactNode }) {
  if (!(await getSession())) return fallback

  return (
    <Link href="/ballot" className={className}>
      {children}
    </Link>
  )
}

export function BallotEntry({
  children = 'Ballot',
  className = 'inline-flex min-h-11 cursor-pointer items-center font-medium hover:underline hover:underline-offset-4',
}: BallotEntryProps) {
  const fallback = <BallotSignInTrigger className={className}>{children}</BallotSignInTrigger>

  return (
    <Suspense fallback={fallback}>
      <SessionBallotEntry className={className} fallback={fallback}>
        {children}
      </SessionBallotEntry>
    </Suspense>
  )
}
