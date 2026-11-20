'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { YEAR_LEVEL_LABELS, type YearLevel } from '@/server/trpc/api/v1/registration/schema'
import { RegistrationForm } from './registration-form'
import { registrationAction, registrationHeading } from './registration-styles'

const statusCopy = {
  PENDING: {
    label: 'Pending review',
    title: 'Registration submitted.',
    description: 'Your Student Profile is ready for COMELEC review. Check this page for updates.',
  },
  APPROVED: {
    label: 'Approved',
    title: 'Registration approved',
    description: 'You can vote when the election is open. Approved registrations are read-only.',
  },
  REJECTED: {
    label: null,
    title: 'Registration rejected',
    description: 'Review the reason below before submitting a corrected Student Profile.',
  },
}

const closedMessage =
  'New registrations and resubmissions are currently closed. You can submit during the registration period or while the election is open.'

const textButton =
  'inline-flex min-h-11 items-center text-sm font-medium hover:underline hover:underline-offset-4 disabled:opacity-60'

export function RegisterPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [sessionExpired, setSessionExpired] = useState(false)
  const options = trpc.registration.getMine.queryOptions()
  const query = useQuery({
    ...options,
    staleTime: 0,
    retry: false,
    refetchInterval: 30_000,
  })
  const needsSignIn = sessionExpired || query.error?.data?.code === 'UNAUTHORIZED'
  const { isPending: isLoading, isError, data } = query
  const registration = needsSignIn ? null : data?.registration
  const state = registration ? statusCopy[registration.status] : null
  const closed = data?.canSubmit === false

  function refresh() {
    void query.refetch()
  }

  function submitted(yearLevel: YearLevel) {
    // Keep the successful submission visible if the following read fails.
    if (data) {
      queryClient.setQueryData(options.queryKey, {
        ...data,
        registration: { status: 'PENDING' as const, yearLevel, rejectionReason: null },
      })
    }
    void queryClient.invalidateQueries({ queryKey: options.queryKey })
  }

  return (
    <div
      className={`min-w-0 space-y-6 px-[clamp(1.375rem,4.25vw,2.75rem)] py-8 min-[56rem]:px-[clamp(2.5rem,7.23vw,6.5rem)] min-[56rem]:py-12 ${needsSignIn ? '[&>*]:max-w-[35rem]' : ''}`}
    >
      <header className="space-y-4" aria-live="polite">
        {state?.label && (
          <p className="inline-block border border-[#819667] px-3 py-1.5 text-xs font-medium">
            {state.label}
          </p>
        )}
        {!state && (
          <p className="text-xs font-medium tracking-wide text-[#56654a] uppercase">
            Voter registration
          </p>
        )}
        <h1
          className={`${registrationHeading} text-[clamp(2.75rem,3.9vw,3.5rem)] ${needsSignIn ? 'min-[56rem]:text-[clamp(3rem,4.45vw,4rem)]' : ''} ${registration?.status === 'PENDING' ? 'max-w-[13ch] text-balance' : ''}`}
        >
          {needsSignIn ? (
            <>
              Make your
              <br />
              voice count.
            </>
          ) : (
            (state?.title ?? (closed ? 'Registration closed' : 'Register to vote.'))
          )}
        </h1>
        {needsSignIn ? (
          <p className="text-base leading-relaxed text-[#56654a] sm:text-lg">
            Sign in with your USC email account through Google to register for the election.
          </p>
        ) : (
          (state || data) && (
            <p className="max-w-[36rem] text-base leading-relaxed text-[#56654a]">
              {state?.description ??
                (closed
                  ? closedMessage
                  : 'Submit your year level and Student Profile for COMELEC review.')}
            </p>
          )
        )}
      </header>

      {needsSignIn ? (
        <>
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Auth.js serves this sign-in endpoint. */}
          <a
            href="/api/auth/signin?callbackUrl=%2Fregister"
            className={`${registrationAction} w-full`}
          >
            Continue with Google
          </a>
          <p className="text-sm leading-relaxed text-[#56654a]">
            Have your year level and current Student Profile ready.
          </p>
          <div className="border-t border-[#b6c89f] pt-3">
            <Link href="/" className={textButton}>
              <span aria-hidden="true" className="me-2">
                ←
              </span>{' '}
              Back to home
            </Link>
          </div>
        </>
      ) : isLoading ? (
        <div className="space-y-4 border-t border-[#b6c89f] pt-6">
          <output className="block text-sm text-[#56654a]">Loading registration…</output>
          <div aria-hidden="true" className="h-12 border border-[#b6c89f] bg-[#f1edd8]" />
          <div aria-hidden="true" className="h-24 border border-[#b6c89f] bg-[#f1edd8]" />
        </div>
      ) : (
        <>
          {isError && (
            <div className="space-y-2 border-t border-[#b6c89f] pt-5">
              <p role="alert" className="text-sm leading-relaxed text-[#862f29]">
                {data
                  ? 'Unable to refresh your registration status. Your last known status is shown below.'
                  : 'Unable to load your registration. Please try again.'}
              </p>
              {!data && (
                <button
                  type="button"
                  onClick={refresh}
                  disabled={query.isFetching}
                  className={textButton}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {(data?.account || registration) && (
            <section
              aria-label="Registration details"
              className="space-y-4 border-y border-[#b6c89f] py-5"
            >
              {data?.account && (
                <div className="min-w-0 wrap-anywhere">
                  <p className="font-medium">{data.account.name}</p>
                  <p className="mt-1 text-sm text-[#56654a]">{data.account.email}</p>
                </div>
              )}
              {registration && (
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 text-sm">
                  <dt className="text-[#56654a]">Year Level</dt>
                  <dd className="text-end font-medium">
                    {YEAR_LEVEL_LABELS[registration.yearLevel as YearLevel] ??
                      registration.yearLevel}
                  </dd>
                  <dt className="text-[#56654a]">Student Profile</dt>
                  <dd className="text-end font-medium">Submitted</dd>
                </dl>
              )}
            </section>
          )}

          {registration?.status === 'REJECTED' && (
            <div className="border-s-2 border-[#862f29] bg-[#f4e8d8] p-4">
              <p className="text-sm font-semibold">Admin’s reason</p>
              <p className="mt-2 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-[#56654a]">
                {registration.rejectionReason ||
                  'No reason was provided. Contact the election administrator.'}
              </p>
            </div>
          )}

          {registration && closed && (
            <section aria-labelledby="registration-closed-heading" className="space-y-2">
              <h2 id="registration-closed-heading" className="text-lg font-medium">
                Registration closed
              </h2>
              <p className="text-sm leading-relaxed text-[#56654a]">{closedMessage}</p>
            </section>
          )}

          {data?.canSubmit && !isError && (!registration || registration.status === 'REJECTED') && (
            <RegistrationForm
              key={
                registration
                  ? `rejected-${registration.yearLevel}-${registration.rejectionReason}`
                  : 'new'
              }
              initialYearLevel={registration?.yearLevel}
              resubmitting={registration?.status === 'REJECTED'}
              onSubmitted={submitted}
              onSessionExpired={() => setSessionExpired(true)}
              onRefresh={refresh}
            />
          )}

          {registration && registration.status !== 'REJECTED' && (
            <Link href="/" className={`${registrationAction} min-w-48`}>
              Back to home
            </Link>
          )}
        </>
      )}
    </div>
  )
}
