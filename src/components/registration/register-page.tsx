'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { schoolLabel, type School } from '@/server/trpc/api/v1/registration/core/school'
import { YEAR_LEVEL_LABELS, type YearLevel } from '@/server/trpc/api/v1/registration/schema'
import { RegistrationForm } from './registration-form'
import { SchoolPrompt } from './school-prompt'
import { RegistrationSignIn } from './registration-sign-in'
import {
  registrationAction,
  registrationHeading,
  registrationPanel,
  registrationPanelEntrance,
  registrationTextButton,
} from './registration-styles'

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
  if (needsSignIn) return <RegistrationSignIn />

  const { isPending: isLoading, isError, data } = query
  const registration = data?.registration
  const state = registration ? statusCopy[registration.status] : null
  const closed = data?.canSubmit === false
  const showForm =
    !!data?.canSubmit && !isError && (!registration || registration.status === 'REJECTED')
  // The form asks for School itself; otherwise ask once if this Registration predates School.
  const askForSchool = !!registration && !registration.school && !showForm

  function refresh() {
    void query.refetch()
  }

  function submitted(yearLevel: YearLevel, school: School) {
    // Keep the successful submission visible if the following read fails.
    if (data) {
      queryClient.setQueryData(options.queryKey, {
        ...data,
        registration: { status: 'PENDING' as const, yearLevel, school, rejectionReason: null },
      })
    }
    void queryClient.invalidateQueries({ queryKey: options.queryKey })
  }

  return (
    <div
      key={isLoading ? 'loading' : 'live'}
      className={`${registrationPanel} ${isLoading ? '' : registrationPanelEntrance}`}
    >
      <header className="space-y-4" aria-live="polite">
        {state?.label && (
          <p className="inline-block border border-[#819667] px-3 py-1.5 text-xs font-medium">
            {state.label}
          </p>
        )}
        <h1
          className={`${registrationHeading} text-[clamp(2.75rem,3.9vw,3.5rem)] ${registration?.status === 'PENDING' ? 'max-w-[13ch] text-balance' : ''}`}
        >
          {state?.title ?? (closed ? 'Registration closed' : 'Register to vote.')}
        </h1>
        {(state || data) && (
          <p className="max-w-[36rem] text-base leading-relaxed text-[#56654a]">
            {state?.description ??
              (closed
                ? closedMessage
                : 'Submit your year level and Student Profile for COMELEC review.')}
          </p>
        )}
      </header>

      {isLoading ? (
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
                  className={registrationTextButton}
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
                  {registration.school && (
                    <>
                      <dt className="text-[#56654a]">School</dt>
                      <dd className="text-end font-medium">{schoolLabel(registration.school)}</dd>
                    </>
                  )}
                  <dt className="text-[#56654a]">Student Profile</dt>
                  <dd className="text-end font-medium">Submitted</dd>
                </dl>
              )}
            </section>
          )}

          {askForSchool && (
            <SchoolPrompt actionClassName={`${registrationAction} w-full`} onSaved={refresh} />
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

          {showForm && (
            <RegistrationForm
              key={
                registration
                  ? `rejected-${registration.yearLevel}-${registration.rejectionReason}`
                  : 'new'
              }
              initialYearLevel={registration?.yearLevel}
              initialSchool={registration?.school}
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
