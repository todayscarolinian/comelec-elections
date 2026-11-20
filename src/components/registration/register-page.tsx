'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { useTRPC } from '@/lib/trpc/client'
import { YEAR_LEVEL_LABELS, type YearLevel } from '@/server/trpc/api/v1/registration/schema'
import { RegistrationForm } from './registration-form'
import { RegistrationShell } from './registration-shell'

export type RegistrationApplicant = {
  name: string
  email: string
}

type RegisterPageProps = {
  applicant?: RegistrationApplicant | null
}

const secondaryActionButton =
  'inline-flex h-11 items-center justify-center border border-comelec-forest px-5 text-sm font-medium text-comelec-forest transition-colors hover:bg-comelec-sage-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest disabled:cursor-not-allowed disabled:opacity-50'

export function RegisterPage({ applicant }: Readonly<RegisterPageProps>) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [sessionExpired, setSessionExpired] = useState(false)
  const [submittedFileName, setSubmittedFileName] = useState<string>()
  const options = trpc.registration.getMine.queryOptions()
  const query = useQuery({
    ...options,
    staleTime: 0,
    retry: false,
    refetchInterval: 30_000,
  })
  const needsSignIn = sessionExpired || query.error?.data?.code === 'UNAUTHORIZED'
  const data = query.data
  const registration = data?.registration

  function refresh() {
    void query.refetch()
  }

  function submitted(yearLevel: YearLevel, fileName?: string) {
    if (fileName) setSubmittedFileName(fileName)
    // The mutation committed successfully. Keep that fact even if the following read fails.
    queryClient.setQueryData(options.queryKey, {
      canSubmit: data?.canSubmit ?? false,
      registration: { status: 'PENDING' as const, yearLevel, rejectionReason: null },
    })
    void queryClient.invalidateQueries({ queryKey: options.queryKey })
  }

  const yearLevelLabel = registration
    ? (YEAR_LEVEL_LABELS[registration.yearLevel as YearLevel] ?? registration.yearLevel)
    : null

  return (
    <RegistrationShell>
      {needsSignIn ? (
        <section aria-labelledby="sign-in-heading" className="max-w-[560px] space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.08em] text-comelec-olive uppercase">
              VOTER REGISTRATION
            </p>
            <h1
              id="sign-in-heading"
              className="font-display text-5xl leading-[1.06] text-comelec-forest italic sm:text-[64px]"
            >
              Make your
              <br />
              voice count.
            </h1>
            <p className="text-lg leading-relaxed text-comelec-olive">
              Sign in with your USC email to register for the election.
            </p>
          </div>

          <GoogleSignInButton
            label="Continue with Google"
            className="flex h-[52px] w-full cursor-pointer items-center justify-center bg-comelec-forest px-7 text-base font-medium text-comelec-cream transition-colors hover:bg-comelec-forest-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="text-sm leading-relaxed text-comelec-olive">
            Have your Year Level and current Student Profile ready.
          </p>

          <div className="h-px w-full bg-comelec-sage" />

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-comelec-forest transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
          >
            <span aria-hidden="true">←</span>
            <span>Back to home</span>
          </Link>
        </section>
      ) : query.isPending ? (
        <div className="space-y-6">
          <p className="text-xs font-medium tracking-[0.08em] text-comelec-olive uppercase">
            VOTER REGISTRATION
          </p>
          <output className="block text-base text-comelec-olive">Loading registration…</output>
          <div aria-hidden="true" className="h-14 w-3/4 bg-comelec-sage/40" />
          <div aria-hidden="true" className="h-32 w-full bg-comelec-sage/30" />
        </div>
      ) : (
        <div className="space-y-6">
          {query.isError && (
            <div className="space-y-3 border border-review-error/40 bg-comelec-cream/60 p-4">
              <p role="alert" className="text-sm leading-relaxed text-review-error">
                {data
                  ? 'Unable to refresh your registration status. Your last known status is shown below.'
                  : 'Unable to load your registration. Please try again.'}
              </p>
              <button
                type="button"
                onClick={refresh}
                disabled={query.isFetching}
                className={secondaryActionButton}
              >
                {data ? 'Refresh status' : 'Try again'}
              </button>
            </div>
          )}

          {/* Status views: PENDING, APPROVED, REJECTED */}
          {registration && (
            <section
              aria-labelledby="registration-status-heading"
              aria-live="polite"
              className="space-y-6"
            >
              <div className="space-y-4">
                <span className="inline-flex items-center border border-comelec-forest px-3 py-1.5 text-xs font-medium text-comelec-forest">
                  {registration.status === 'APPROVED'
                    ? 'Approved'
                    : registration.status === 'PENDING'
                      ? 'Pending review'
                      : 'Action required'}
                </span>
                <h1
                  id="registration-status-heading"
                  className={`font-display text-5xl text-comelec-forest italic sm:text-[56px] ${
                    registration.status === 'PENDING' ? 'leading-[1.21]' : 'leading-[1.08]'
                  }`}
                >
                  {registration.status === 'APPROVED' ? (
                    'Registration approved.'
                  ) : registration.status === 'PENDING' ? (
                    <>
                      Registration <br />
                      submitted.
                    </>
                  ) : (
                    'Registration rejected.'
                  )}
                </h1>
                <p className="max-w-[580px] text-lg leading-relaxed text-comelec-olive">
                  {registration.status === 'APPROVED'
                    ? 'Your registration is approved. You can vote when the Election is open. Approved registrations cannot be changed here.'
                    : registration.status === 'PENDING'
                      ? 'Your registration is submitted. COMELEC will review your student profile before you can vote.'
                      : 'An Admin rejected your registration. Review the reason below before submitting a corrected Student Profile.'}
                </p>
              </div>

              {registration.status === 'REJECTED' ? (
                <div className="border border-comelec-forest/40 bg-comelec-sage-soft/50 p-5">
                  <p className="text-sm font-medium text-comelec-forest">Admin’s reason</p>
                  <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-comelec-olive">
                    {registration.rejectionReason ||
                      'No reason was provided. Contact the election administrator.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="h-px w-full bg-comelec-sage" />

                  {applicant && (
                    <div className="space-y-1">
                      <p className="text-lg font-medium text-comelec-forest">{applicant.name}</p>
                      <p className="text-sm text-comelec-olive">{applicant.email}</p>
                    </div>
                  )}

                  <dl className="space-y-4 text-sm">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-comelec-olive">
                        {registration.status === 'PENDING' ? 'Year level' : 'Year Level'}
                      </dt>
                      <dd className="font-medium text-comelec-forest">{yearLevelLabel}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-comelec-olive">Student Profile</dt>
                      <dd className="min-w-0 text-right font-medium break-words text-comelec-forest">
                        {submittedFileName ?? 'Submitted'}
                      </dd>
                    </div>
                  </dl>

                  <div className="h-px w-full bg-comelec-sage" />

                  <p className="text-sm text-comelec-olive">
                    Check this page for your registration status.
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href={registration.status === 'APPROVED' ? '/ballot' : '/'}
                      className="inline-flex h-[52px] min-w-[240px] items-center justify-center bg-comelec-forest px-7 text-base font-medium text-comelec-cream transition-colors hover:bg-comelec-forest-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
                    >
                      {registration.status === 'APPROVED' ? 'Go to ballot' : 'Back to home'}
                    </Link>

                    {registration.status === 'APPROVED' && !query.isError && (
                      <button
                        type="button"
                        onClick={refresh}
                        disabled={query.isFetching}
                        className={secondaryActionButton}
                      >
                        Refresh status
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* New registration intro */}
          {!registration && data?.canSubmit && !query.isError && (
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-medium tracking-[0.08em] text-comelec-olive uppercase">
                  VOTER REGISTRATION
                </p>
                <h1 className="font-display text-5xl leading-[1.08] text-comelec-forest italic sm:text-[56px]">
                  Register to vote.
                </h1>
                <p className="text-base leading-relaxed text-comelec-olive">
                  Submit your year level and student profile for COMELEC review.
                </p>
              </div>

              {applicant && (
                <div className="space-y-1">
                  <p className="text-base font-medium text-comelec-forest">{applicant.name}</p>
                  <p className="text-sm text-comelec-olive">{applicant.email}</p>
                </div>
              )}

              <div className="h-px w-full bg-comelec-sage" />
            </div>
          )}

          {/* Registration closed */}
          {data && !data.canSubmit && (
            <section
              aria-labelledby="registration-closed-heading"
              className={`space-y-3 ${registration ? 'border-t border-comelec-sage pt-6' : ''}`}
            >
              {!registration && (
                <p className="text-xs font-medium tracking-[0.08em] text-comelec-olive uppercase">
                  VOTER REGISTRATION
                </p>
              )}
              <h2
                id="registration-closed-heading"
                className="font-display text-4xl leading-tight text-comelec-forest italic sm:text-5xl"
              >
                Registration closed
              </h2>
              <p className="text-base leading-relaxed text-comelec-olive">
                New registrations and resubmissions are not being accepted. You can submit only
                while the Registration Period or the Election is open.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/"
                  className="inline-flex h-[52px] min-w-[200px] items-center justify-center bg-comelec-forest px-7 text-base font-medium text-comelec-cream transition-colors hover:bg-comelec-forest-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest"
                >
                  Back to home
                </Link>
                {!query.isError && (
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={query.isFetching}
                    className={secondaryActionButton}
                  >
                    Refresh status
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Registration / resubmission form */}
          {data?.canSubmit &&
            !query.isError &&
            (!registration || registration.status === 'REJECTED') && (
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
        </div>
      )}
    </RegistrationShell>
  )
}
