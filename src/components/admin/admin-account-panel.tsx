import { ArrowUpRight } from 'lucide-react'
import { signOutFromElection } from '@/server/auth/actions'
import { Bone } from './admin-skeletons'

export function AdminAccountPanel({ email }: { email: string | null }) {
  return (
    <div className="grid gap-1 text-xs">
      <small className="text-[10px] text-review-muted">SIGNED IN AS</small>
      {email ? (
        <span className="wrap-anywhere">{email}</span>
      ) : (
        <span className="py-0.5">
          <output className="sr-only">Loading account</output>
          <Bone className="h-3.5 w-40" />
        </span>
      )}
      <form action={signOutFromElection}>
        <button
          type="submit"
          className="inline-flex min-h-8 items-center gap-1 border-0 bg-transparent p-0 text-sm text-review-ink underline underline-offset-3"
        >
          Sign out
          <ArrowUpRight aria-hidden="true" size={14} />
        </button>
      </form>
    </div>
  )
}
