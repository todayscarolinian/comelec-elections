'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import {
  AdminLoadError,
  AdminPage,
  ConfirmDialog,
  adminButton,
  adminErrorMessage,
  adminField,
  adminLink,
  adminTable,
  errorCode,
  formatDateTime,
  isAccessError,
} from '../admin-ui'
import { TableSkeleton } from '../admin-skeletons'

export function AdminManagement() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const admins = useQuery({
    ...trpc.admin.listAdmins.queryOptions(),
    retry: (failureCount, error) => failureCount < 1 && !isAccessError(error),
  })
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: trpc.admin.listAdmins.queryKey() })
  const grant = useMutation(trpc.admin.grantAdmin.mutationOptions({ onSettled: refresh }))
  const revoke = useMutation(trpc.admin.revokeAdmin.mutationOptions({ onSettled: refresh }))
  const [email, setEmail] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function submitGrant(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    setError('')
    try {
      const granted = await grant.mutateAsync({ email })
      setNotice(`${granted.email} is now an admin.`)
      setEmail('')
    } catch (grantError) {
      setError(
        errorCode(grantError) === 'BAD_REQUEST'
          ? 'Enter a valid USC email address.'
          : adminErrorMessage(grantError, 'Unable to grant admin access. Please try again.'),
      )
    }
  }

  async function confirmRevoke() {
    if (!revoking) return
    setNotice('')
    setError('')
    try {
      await revoke.mutateAsync({ email: revoking })
      setNotice(`${revoking} no longer has admin access.`)
    } catch (revokeError) {
      setError(
        errorCode(revokeError) === 'PRECONDITION_FAILED'
          ? 'You cannot revoke the last admin.'
          : adminErrorMessage(revokeError, 'Unable to revoke admin access. Please try again.'),
      )
    } finally {
      setRevoking(null)
    }
  }

  return (
    <AdminPage
      title="Admins"
      subtitle="Admins can review registrations, audit ballots and release results."
    >
      <form
        onSubmit={(event) => void submitGrant(event)}
        className="grid max-w-[640px] gap-3 min-[761px]:grid-cols-[minmax(0,1fr)_auto] min-[761px]:items-end"
      >
        <label className={adminField}>
          Grant admin access
          <input
            type="email"
            required
            placeholder="School email (@usc.edu.ph)"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="submit" className={adminButton} disabled={grant.isPending}>
          {grant.isPending ? 'Granting…' : 'Grant access'}
        </button>
      </form>
      <output className="mt-3 block text-xs not-empty:py-1">{notice}</output>
      {error && (
        <p role="alert" className="text-review-error">
          {error}
        </p>
      )}

      <div className="mt-6">
        {admins.isPending ? (
          <TableSkeleton label="Loading admins…" columns={4} rows={3} />
        ) : admins.isError ? (
          <AdminLoadError error={admins.error} onRetry={() => void admins.refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className={adminTable}>
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Granted by</th>
                  <th scope="col">Granted</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.data.map((admin) => (
                  <tr key={admin.email}>
                    <td className="wrap-anywhere">{admin.email}</td>
                    <td className="wrap-anywhere text-review-muted">{admin.grantedBy || '-'}</td>
                    <td className="whitespace-nowrap text-review-muted">
                      {formatDateTime(admin.grantedAt)}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className={`${adminLink} border-0 bg-transparent p-0 text-review-error`}
                        disabled={revoke.isPending || admins.data.length <= 1}
                        title={
                          admins.data.length <= 1 ? 'The last admin cannot be revoked' : undefined
                        }
                        onClick={() => setRevoking(admin.email)}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={revoking !== null}
        title="Revoke admin access?"
        confirmLabel="Revoke access"
        danger
        busy={revoke.isPending}
        onCancel={() => setRevoking(null)}
        onConfirm={() => void confirmRevoke()}
      >
        <p>
          <strong className="wrap-anywhere text-review-ink">{revoking}</strong> loses admin access
          on their next action.
        </p>
        <p>If this is your own account, you will lose access to these pages.</p>
      </ConfirmDialog>
    </AdminPage>
  )
}
