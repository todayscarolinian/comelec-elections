'use client'

import { useEffect, useRef, useState } from 'react'
import {
  SCHOOLS,
  SCHOOL_LABELS,
  isSchool,
  type School,
} from '@/server/trpc/api/v1/registration/core/school'
import { YEAR_LEVELS, type YearLevel } from '@/server/trpc/api/v1/registration/schema'
import { StudentProfileImage } from './student-profile-image'
import { OcrFindings } from './ocr-findings'
import { statusLabels, type Registration } from './types'

export function ApplicationReview({
  registration,
  onDecision,
  onBack,
  focusOnOpen,
  saving,
  onRefresh,
}: {
  registration: Registration
  onDecision: (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    year: YearLevel,
    school: School | undefined,
    reason: string,
  ) => Promise<void>
  onBack: () => void
  focusOnOpen: boolean
  saving: boolean
  onRefresh: () => void
}) {
  const [year, setYear] = useState(registration.yearLevel as YearLevel)
  // Registrations made before School existed have none; approving leaves it empty unless set.
  const [school, setSchool] = useState(registration.school ?? '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const documentRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (focusOnOpen && window.matchMedia('(width < 761px)').matches) headingRef.current?.focus()
  }, [focusOnOpen])

  function reject() {
    if (!reason.trim()) {
      setError('Enter a reason so the applicant knows what to correct.')
      reasonRef.current?.focus()
      return
    }
    void onDecision(
      registration.id,
      'REJECTED',
      registration.yearLevel as YearLevel,
      undefined,
      reason.trim(),
    )
  }

  return (
    <article
      className="hidden min-w-0 gap-4 border border-review-line p-4 max-[761px]:group-[.is-detail]:grid min-[761px]:grid min-[761px]:gap-3 min-[761px]:p-5"
      aria-labelledby="applicant-name"
    >
      <button
        className="min-h-11 border-0 bg-transparent p-0 text-review-ink underline underline-offset-3 min-[761px]:min-h-7 block justify-self-start min-[761px]:hidden"
        onClick={onBack}
      >
        ← Back to applicants
      </button>
      <header className="flex flex-col items-start justify-between gap-2 border-b border-review-line pb-3 min-[761px]:flex-row min-[761px]:items-center min-[761px]:gap-3 [&_h2]:font-editorial [&_h2]:text-[26px] [&_h2]:leading-[1.2] min-[761px]:[&_h2]:text-2xl [&_p]:mt-1 [&_p]:wrap-anywhere [&_p]:text-review-muted [&_small]:mt-1 [&_small]:block [&_small]:text-[11px] [&_small]:text-review-muted">
        <div>
          <h2 id="applicant-name" ref={headingRef} tabIndex={-1}>
            {registration.name}
          </h2>
          <p>{registration.email}</p>
          <small>
            Submitted{' '}
            {new Intl.DateTimeFormat('en-PH', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Manila',
            }).format(registration.submittedAt)}
          </small>
          {registration.hasHeldBallot && (
            <p className="text-xs font-medium">
              Held Ballot{registration.status === 'PENDING' ? ' · priority review' : ''}
            </p>
          )}
        </div>
        <span className="text-xs whitespace-nowrap text-review-muted min-[761px]:text-[11px]">
          {registration.status === 'PENDING' ? 'PENDING REVIEW' : registration.status}
        </span>
      </header>
      <div className="grid grid-cols-1 gap-6 min-[761px]:gap-4 min-[1301px]:grid-cols-[minmax(0,344fr)_minmax(0,368fr)] min-[1301px]:gap-6 [&>section]:min-w-0">
        <section aria-label="Student profile">
          <div className="mb-2 flex items-center justify-between gap-2 [&_h3]:text-[13px] [&_h3]:font-medium">
            <h3>Student profile</h3>
            <button
              className="min-h-11 border-0 bg-transparent p-0 text-review-ink underline underline-offset-3 min-[761px]:min-h-7"
              onClick={() => documentRef.current?.showModal()}
            >
              Open document ↗
            </button>
          </div>
          <StudentProfileImage
            url={registration.studentProfileUrl}
            name={registration.name}
            onRefresh={onRefresh}
          />
        </section>
        <OcrFindings registration={registration} />
      </div>
      {registration.status === 'PENDING' ? (
        <div className="grid gap-6 border-t border-review-line pt-3 min-[761px]:gap-2">
          <div className="grid grid-cols-1 items-end gap-3 min-[761px]:grid-cols-2 min-[1301px]:grid-cols-[minmax(130px,216fr)_minmax(130px,216fr)_minmax(100px,256fr)_minmax(170px,216fr)] min-[1301px]:gap-6">
            <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]">
              Year level on approval
              <select
                disabled={saving}
                value={year}
                onChange={(event) => setYear(event.target.value as YearLevel)}
              >
                {YEAR_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    Year {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]">
              School on approval
              <select
                disabled={saving}
                value={school}
                onChange={(event) => setSchool(event.target.value)}
              >
                {school === '' && <option value="">Not given</option>}
                {SCHOOLS.map((value) => (
                  <option key={value} value={value}>
                    {SCHOOL_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-review-muted [&_small]:mt-1 [&_small]:block [&_small]:text-[11px]">
              Correct the year or School if needed.
              <small>Both are used for statistics only.</small>
            </p>
            <button
              className="col-span-full min-h-12 border border-review-ink bg-review-ink px-3.5 py-2.5 text-sm text-review-paper hover:bg-[#263e17] min-[761px]:min-h-11 min-[1301px]:col-span-1"
              disabled={saving}
              onClick={() => {
                void onDecision(
                  registration.id,
                  'APPROVED',
                  year,
                  isSchool(school) ? school : undefined,
                  '',
                )
              }}
            >
              Approve registration
            </button>
          </div>
          <div>
            <label
              className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]"
              htmlFor="rejection-reason"
            >
              Rejection reason · required only when rejecting
            </label>
            <div className="mt-1.5 grid grid-cols-1 items-start gap-3 min-[761px]:grid-cols-[minmax(0,1fr)_156px] min-[761px]:gap-4 [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:border [&_textarea]:border-review-line [&_textarea]:bg-review-paper [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-base [&_textarea]:text-review-ink [&_textarea::placeholder]:text-review-muted [&_textarea[aria-invalid=true]]:border-review-error min-[761px]:[&_textarea]:min-h-[50px] min-[761px]:[&_textarea]:text-xs">
              <textarea
                id="rejection-reason"
                ref={reasonRef}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  setError('')
                }}
                placeholder="Explain what the applicant needs to correct"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'reason-error' : undefined}
                rows={2}
                maxLength={2000}
                disabled={saving}
              />
              <button
                className="min-h-12 border border-review-error bg-review-paper px-3.5 py-2.5 text-sm text-review-error hover:bg-[#f5e4d4] min-[761px]:min-h-11"
                disabled={saving}
                onClick={reject}
              >
                Reject
              </button>
            </div>
            {error && (
              <p id="reason-error" className="text-xs text-review-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-review-line pt-3 [&_h3]:text-sm [&_p]:mt-2 [&_p]:wrap-anywhere">
          <h3>{statusLabels[registration.status]} registration</h3>
          {registration.rejectionReason && <p>Reason: {registration.rejectionReason}</p>}
          <p className="text-xs text-review-muted">
            Reviewed by {registration.reviewedBy ?? 'an Admin'}
            {registration.reviewedAt
              ? ` · ${new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(registration.reviewedAt)}`
              : ''}
          </p>
        </div>
      )}
      <dialog
        ref={documentRef}
        className="m-auto max-h-[90dvh] w-[min(90vw,760px)] border border-review-line bg-review-paper p-6 text-review-ink backdrop:bg-[#18231199]"
        aria-labelledby="document-title"
        closedby="any"
      >
        <div className="mb-4 flex items-center justify-between gap-4 [&_h2]:font-editorial [&_h2]:text-2xl">
          <h2 id="document-title">Student profile</h2>
          <button
            className="min-h-11 border-0 bg-transparent p-0 text-review-ink underline underline-offset-3 min-[761px]:min-h-7"
            onClick={() => documentRef.current?.close()}
          >
            Close ×
          </button>
        </div>
        <StudentProfileImage
          url={registration.studentProfileUrl}
          name={registration.name}
          onRefresh={onRefresh}
        />
      </dialog>
    </article>
  )
}
