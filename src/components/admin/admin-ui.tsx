'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export const adminButton =
  'inline-flex min-h-11 items-center justify-center gap-2 bg-review-ink px-6 py-3 text-sm font-medium text-[#effed4] hover:bg-[#253b16]'
export const adminSecondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 border border-review-line bg-review-paper px-6 py-3 text-sm text-review-ink hover:bg-review-selected'
export const adminDangerButton =
  'inline-flex min-h-11 items-center justify-center gap-2 border border-review-error bg-transparent px-6 py-3 text-sm text-review-error hover:bg-[#f7e3dc]'
export const adminLink =
  'inline-flex min-h-8 items-center gap-1 text-review-ink underline underline-offset-3'
export const adminField =
  'flex flex-col gap-1.5 text-[11px] text-review-muted [&_input]:min-h-[42px] [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:text-[13px] [&_input]:text-review-ink [&_select]:min-h-[42px] [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:text-[13px] [&_select]:text-review-ink'
export const adminTable =
  'w-full border-collapse text-left text-xs [&_th]:border-b [&_th]:border-review-line [&_th]:py-2 [&_th]:pr-4 [&_th]:font-normal [&_th]:text-review-muted [&_td]:border-b [&_td]:border-review-line [&_td]:py-3 [&_td]:pr-4 [&_td]:align-top'

export function errorCode(error: unknown) {
  return (error as { data?: { code?: string } } | null)?.data?.code
}

export function isAccessError(error: unknown) {
  const code = errorCode(error)
  return code === 'UNAUTHORIZED' || code === 'FORBIDDEN'
}

/** Message for a failed Admin request; never echoes inputs. */
export function adminErrorMessage(error: unknown, fallback: string) {
  if (isAccessError(error)) return "You don't have Admin access."
  if (errorCode(error) === 'PRECONDITION_FAILED' && error instanceof Error) return error.message
  return fallback
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDateTime(date: Date) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AdminPage({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string
  subtitle?: ReactNode
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="min-w-0 px-4 py-6 min-[761px]:p-6 min-[1301px]:px-10 min-[1301px]:pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] leading-4 text-review-muted">COMMISSION ADMIN</p>
          <h1 className="my-1 font-display text-[clamp(30px,8.5vw,40px)] leading-[1.15] italic min-[761px]:text-5xl min-[761px]:leading-[1.1]">
            {title}
          </h1>
          {subtitle && <p className="text-review-muted">{subtitle}</p>}
        </div>
        {aside && <div className="text-right text-xs">{aside}</div>}
      </header>
      <div className="mt-6">{children}</div>
    </main>
  )
}

export function AdminLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="grid justify-items-start gap-2">
      <p>{adminErrorMessage(error, 'Unable to load this page. Please try again.')}</p>
      {!isAccessError(error) && (
        <button type="button" className={adminLink} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

/** Native modal dialog for irreversible or high-impact Admin actions. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close?.()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] border border-review-line bg-review-paper p-6 text-[13px] text-review-ink backdrop:bg-[#253b16]/40"
    >
      <h2 id="confirm-dialog-title" className="font-display text-3xl italic">
        {title}
      </h2>
      <div className="mt-3 grid gap-3 text-review-muted">{children}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className={adminSecondaryButton} disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? adminDangerButton : adminButton}
          disabled={busy || confirmDisabled}
          onClick={onConfirm}
        >
          {busy ? 'Saving…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
