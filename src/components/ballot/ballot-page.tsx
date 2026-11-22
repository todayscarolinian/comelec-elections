'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { electionDay } from '@/components/landing/landing-schedule'
import { useTRPC } from '@/lib/trpc/client'
import { BallotFlow } from './ballot-flow'
import { BallotSignIn } from './ballot-sign-in'
import { BallotSkeleton } from './ballot-skeleton'
import { BallotIntro, BallotProgress } from './ballot-steps'
import { ballotAction, ballotEntrance, ballotHeading, ballotTextAction } from './ballot-styles'

function Notice({
  heading,
  description,
  href,
  action,
}: {
  heading: string
  description: string
  href?: string
  action?: string
}) {
  return (
    <div className="grow space-y-6 border-t border-comelec-sage py-12 sm:py-20">
      <BallotIntro heading={heading} description={description} />
      {href && (
        <Link href={href} className={ballotAction}>
          {action}
        </Link>
      )}
    </div>
  )
}

function BallotReceipt({
  held,
  justCast,
  rejected,
  rejectionReason,
  canResubmit,
}: {
  held: boolean
  justCast: boolean
  rejected: boolean
  rejectionReason?: string | null
  canResubmit: boolean
}) {
  return (
    <>
      <BallotProgress step="complete" />
      <div className={`mx-auto w-full max-w-5xl grow space-y-7 py-12 sm:py-20 ${ballotEntrance}`}>
        <div className="grid size-14 place-items-center bg-comelec-forest text-comelec-cream">
          <Check size={24} aria-hidden="true" />
        </div>
        <h1 className={ballotHeading}>
          {held
            ? 'Your ballot is held.'
            : justCast
              ? 'Your ballot has been cast.'
              : 'You have already voted.'}
        </h1>
        <output className="block max-w-xl leading-relaxed text-comelec-olive">
          {held
            ? 'Your ballot was recorded. It will count if your registration is approved.'
            : 'Thank you for voting. You can cast only one ballot in this election.'}
        </output>
        {held && rejected && (
          <div className="max-w-xl space-y-2 border border-comelec-sage p-4">
            <p className="font-medium">Registration rejected</p>
            <p className="whitespace-pre-wrap wrap-anywhere text-comelec-olive">
              {rejectionReason || 'No reason was provided. Contact the election administrator.'}
            </p>
            <p>
              {canResubmit
                ? 'Correct your registration before voting closes.'
                : 'The election has closed. You can no longer correct this registration.'}
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4">
          {held && (
            <Link href="/register" className={ballotAction}>
              View registration
            </Link>
          )}
          <Link href="/#turnout" className={held ? ballotTextAction : ballotAction}>
            View turnout <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <Link href="/" className={ballotTextAction}>
            Back to home
          </Link>
        </div>
      </div>
    </>
  )
}

const castErrors: Readonly<Record<string, string>> = {
  ElectionClosed: 'Voting has closed. Your ballot was not submitted.',
  NotRegistered: 'A registration is required to cast a ballot.',
  HeldNotAcknowledged: 'Review and acknowledge the held ballot disclosure before casting.',
  InvalidBallot: 'Check your choices and review your ballot before trying again.',
  AlreadyVoted: 'A ballot has already been recorded for this account.',
}

export function BallotPage() {
  const trpc = useTRPC()
  const client = useQueryClient()
  const [receipt, setReceipt] = useState<{ held: boolean } | null>(null)
  const casting = useRef(false)
  const electionOptions = trpc.election.get.queryOptions()
  const ballotOptions = trpc.ballot.myStatus.queryOptions()
  const registrationOptions = trpc.registration.getMine.queryOptions()
  const election = useQuery({ ...electionOptions, retry: false, refetchInterval: 30_000 })
  const ballot = useQuery({ ...ballotOptions, retry: false, refetchInterval: 30_000 })
  const registration = useQuery({
    ...registrationOptions,
    enabled: ballot.isSuccess,
    retry: false,
    refetchInterval: 30_000,
  })

  function refresh() {
    return Promise.all(
      [electionOptions, ballotOptions, registrationOptions].map(({ queryKey }) =>
        client.invalidateQueries({ queryKey }),
      ),
    )
  }

  const cast = useMutation({
    ...trpc.ballot.cast.mutationOptions(),
    gcTime: 0,
    onSuccess: (result) => {
      setReceipt({ held: result.held })
      cast.reset()
      void refresh()
    },
    onError: async () => {
      await refresh()
    },
    onSettled: () => {
      casting.current = false
    },
  })

  const status = ballot.data?.status
  const voter = registration.data?.registration
  const open = election.data?.status === 'OPEN'
  const held = status === 'held' || (status !== 'already_voted' && Boolean(receipt?.held))
  const castError = cast.error
  const unauthorized =
    ballot.error?.data?.code === 'UNAUTHORIZED' ||
    registration.error?.data?.code === 'UNAUTHORIZED' ||
    castError?.data?.code === 'UNAUTHORIZED'

  let content
  if (unauthorized) {
    content = <BallotSignIn />
  } else if (receipt || status === 'already_voted' || status === 'held') {
    content = (
      <BallotReceipt
        held={held}
        justCast={Boolean(receipt)}
        rejected={voter?.status === 'REJECTED'}
        rejectionReason={voter?.rejectionReason}
        canResubmit={open}
      />
    )
  } else if (
    (!ballot.data && ballot.isError) ||
    (!election.data && election.isError) ||
    (status === 'can_vote' && !registration.data && registration.isError)
  ) {
    content = (
      <div className="grow space-y-5 border-t border-comelec-sage py-12">
        <BallotIntro
          heading="Could not load your ballot."
          description="Please try again to check the current election and registration status."
        />
        <button type="button" onClick={() => void refresh()} className={ballotAction}>
          Try again
        </button>
      </div>
    )
  } else if (!ballot.data || !election.data || (status === 'can_vote' && !registration.data)) {
    content = <BallotSkeleton />
  } else if (status === 'not_registered' || !voter) {
    content = (
      <Notice
        heading="Register before you vote."
        description={
          open
            ? 'Submit your voter registration before opening your ballot.'
            : 'Open Registration to check whether you can submit your Student Profile.'
        }
        href="/register"
        action="Go to registration"
      />
    )
  } else if (!open) {
    content = (
      <Notice
        heading="Voting is closed."
        description="Ballots can be cast while the election is open."
        href="/"
        action="Back to home"
      />
    )
  } else {
    content = (
      <BallotFlow
        held={voter.status !== 'APPROVED'}
        pending={cast.isPending}
        error={
          castError
            ? (castErrors[castError.message] ?? 'Unable to cast your ballot. Please try again.')
            : undefined
        }
        onCast={(input) => {
          if (casting.current) return
          casting.current = true
          cast.mutate(input)
        }}
      />
    )
  }

  return (
    <>
      <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 pt-4 pb-5 text-sm text-comelec-olive">
        <p>
          Nov {electionDay}
          {election.data && (open ? ' · Voting is open' : ' · Voting is closed')}
        </p>
        {registration.data?.account.email && !unauthorized && (
          <p className="wrap-anywhere">
            {registration.data.account.email}
            {voter?.status === 'APPROVED' && ' · Approved voter'}
          </p>
        )}
      </div>
      {content}
    </>
  )
}
