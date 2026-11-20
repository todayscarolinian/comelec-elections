'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'

const NO_ACCESS_CODES = new Set(['UNAUTHORIZED', 'FORBIDDEN'])

function errorMessage(error: unknown, fallback: string) {
  const code = (error as { data?: { code?: string } } | null)?.data?.code
  return code && NO_ACCESS_CODES.has(code) ? "You don't have Admin access." : fallback
}

export function RegistrationWindowToggle() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const windowQuery = useQuery(trpc.admin.getRegistrationWindow.queryOptions())
  const setStatus = useMutation(
    trpc.admin.setRegistrationStatus.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: trpc.admin.getRegistrationWindow.queryKey() }),
    }),
  )

  if (windowQuery.isPending) {
    return <output>Loading Registration window...</output>
  }

  if (windowQuery.isError) {
    return (
      <p role="alert">
        {errorMessage(windowQuery.error, 'Unable to load the Registration window. Please refresh.')}
      </p>
    )
  }

  const { registrationStatus, pendingCount } = windowQuery.data
  const isOpen = registrationStatus === 'OPEN'

  return (
    <section aria-labelledby="registration-window-heading" className="flex flex-col gap-2">
      <h2 id="registration-window-heading" className="text-lg font-semibold">
        Registration window
      </h2>
      <p>{isOpen ? 'Registration is open.' : 'Registration is closed.'}</p>
      <p>
        {pendingCount} pending {pendingCount === 1 ? 'Registration' : 'Registrations'}
      </p>
      <button
        type="button"
        className="self-start rounded border px-4 py-2 disabled:opacity-50"
        disabled={setStatus.isPending}
        onClick={() => setStatus.mutate({ status: isOpen ? 'CLOSED' : 'OPEN' })}
      >
        {isOpen ? 'Close Registration' : 'Open Registration'}
      </button>
      {setStatus.isError && (
        <p role="alert">
          {errorMessage(
            setStatus.error,
            'Unable to update the Registration window. Please try again.',
          )}
        </p>
      )}
    </section>
  )
}
