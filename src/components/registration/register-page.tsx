'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { YEAR_LEVEL_LABELS, type YearLevel } from '@/server/trpc/api/v1/registration/schema'
import { RegistrationForm } from './registration-form'

const secondaryButton =
  'min-h-11 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:outline-emerald-400'

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
  const data = query.data
  const registration = data?.registration

  function refresh() {
    void query.refetch()
  }

  function submitted(yearLevel: YearLevel) {
    // The mutation committed successfully. Keep that fact even if the following read fails.
    queryClient.setQueryData(options.queryKey, {
      canSubmit: data?.canSubmit ?? false,
      registration: { status: 'PENDING' as const, yearLevel, rejectionReason: null },
    })
    void queryClient.invalidateQueries({ queryKey: options.queryKey })
  }

  return (
    <main className="flex-1 bg-zinc-50 px-4 py-8 font-sans text-zinc-950 sm:px-6 sm:py-14 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <p className="text-sm font-semibold tracking-tight">COMELEC Elections</p>
        </header>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Voter registration</h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Submit your Student Profile for review, then check your registration status here.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/50">
          {needsSignIn ? (
            <section aria-labelledby="sign-in-heading" className="space-y-4">
              <h2 id="sign-in-heading" className="text-xl font-semibold">
                Sign in to register
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Use your organization Google account to submit or check your registration.
              </p>
              {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Auth.js serves this sign-in endpoint. */}
              <a
                href="/api/auth/signin?callbackUrl=%2Fregister"
                className="inline-flex min-h-12 items-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-zinc-50 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200 dark:focus-visible:outline-emerald-400"
              >
                Sign in with Google
              </a>
            </section>
          ) : query.isPending ? (
            <div className="space-y-5">
              <output className="block text-sm text-zinc-600 dark:text-zinc-400">
                Loading registration…
              </output>
              <div aria-hidden="true" className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <div aria-hidden="true" className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ) : (
            <>
              {query.isError && (
                <div className="space-y-3">
                  <p
                    role="alert"
                    className="text-sm leading-relaxed text-red-700 dark:text-red-300"
                  >
                    {data
                      ? 'Unable to refresh your registration status. Your last known status is shown below.'
                      : 'Unable to load your registration. Please try again.'}
                  </p>
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={query.isFetching}
                    className={secondaryButton}
                  >
                    {data ? 'Refresh status' : 'Try again'}
                  </button>
                </div>
              )}

              {registration && (
                <section
                  aria-labelledby="registration-status-heading"
                  aria-live="polite"
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="registration-status-heading" className="text-xl font-semibold">
                      {registration.status === 'APPROVED'
                        ? 'Registration approved'
                        : registration.status === 'PENDING'
                          ? 'Pending review'
                          : 'Registration rejected'}
                    </h2>
                    <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {YEAR_LEVEL_LABELS[registration.yearLevel as YearLevel] ??
                        registration.yearLevel}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {registration.status === 'APPROVED'
                      ? 'Your registration is approved. You can vote when the Election is open. Approved registrations cannot be changed here.'
                      : registration.status === 'PENDING'
                        ? 'Your Student Profile has been submitted. An Admin will review your registration; no further action is needed right now.'
                        : 'An Admin rejected your registration. Review the reason below before submitting a corrected Student Profile.'}
                  </p>
                  {registration.status === 'REJECTED' && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                      <p className="text-sm font-semibold">Admin’s reason</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {registration.rejectionReason ||
                          'No reason was provided. Contact the election administrator.'}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {data && !data.canSubmit && (
                <section
                  aria-labelledby="registration-closed-heading"
                  className="space-y-2 border-t border-zinc-200 pt-5 dark:border-zinc-800"
                >
                  <h2 id="registration-closed-heading" className="text-xl font-semibold">
                    Registration closed
                  </h2>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    New registrations and resubmissions are not being accepted. You can submit only
                    while the Registration Period or the Election is open.
                  </p>
                </section>
              )}

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

              {data && !query.isError && (
                <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={query.isFetching}
                    className={secondaryButton}
                  >
                    Refresh status
                  </button>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Status also refreshes automatically.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <p className="mt-5 text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          Your Student Profile is used by Admins to verify your eligibility.
        </p>
      </div>
    </main>
  )
}
