'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  EXPECTED_TERM,
  SAMPLE_REGISTRATIONS,
  YEAR_LEVELS,
  type Registration,
  type RegistrationStatus,
} from './sample-data'

const PAGE_SIZE = 5
const statusLabels: Record<RegistrationStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

function OcrPanel({ registration }: { registration: Registration }) {
  const { ocr } = registration
  const rows =
    ocr.state === 'available'
      ? [
          { label: 'Full name', expected: registration.name, read: ocr.name },
          {
            label: 'Student ID',
            expected: registration.id,
            read: ocr.studentId,
          },
          {
            label: 'Year level',
            expected: `Year ${registration.year}`,
            read: `Year ${ocr.year}`,
          },
          { label: 'Term', expected: EXPECTED_TERM, read: ocr.term },
        ]
      : []
  return (
    <section className="[&>p]:py-2" aria-label="OCR findings">
      <div className="flex items-center justify-between gap-2 border-b border-review-line pb-2 text-review-muted [&_h3]:text-xs [&_h3]:font-medium min-[761px]:[&_h3]:text-[11px] [&_span]:text-xs">
        <h3>OCR FINDINGS</h3>
        <span>
          {ocr.state === 'available'
            ? 'Findings available'
            : ocr.state === 'processing'
              ? 'Processing'
              : 'Unavailable'}
        </span>
      </div>
      {ocr.state === 'available' ? (
        <>
          <p className="text-xs text-review-muted">
            Check the readings against the screenshot before deciding.
          </p>
          <div className="mb-1.5 grid grid-cols-2 gap-4 wrap-anywhere text-xs text-review-muted min-[761px]:text-[11px]">
            <span>Expected</span>
            <span>Read from screenshot</span>
          </div>
          {rows.map((row) => (
            <div
              className="mt-2.5 border-b border-review-line pb-2 min-[761px]:mt-1.5 min-[761px]:pb-1"
              key={row.label}
            >
              <div className="mb-[3px] flex justify-between gap-2 text-xs text-review-muted min-[761px]:text-[11px]">
                <span>{row.label}</span>
                <span
                  className={row.expected !== row.read ? 'text-xs text-review-error' : undefined}
                >
                  {row.expected === row.read ? 'Match' : 'Doesn’t match'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 wrap-anywhere text-sm min-[761px]:text-[13px]">
                <span>{row.expected}</span>
                <span>{row.read || 'Not read'}</span>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <p className="border-b border-review-line py-3 text-[13px] text-review-muted">
            {ocr.state === 'processing'
              ? 'Reading the student profile. You can review the image now.'
              : 'No OCR findings are available. Review the student profile manually.'}
          </p>
          <h3 className="mt-2.5 text-[11px] font-medium text-review-muted">APPLICATION DETAILS</h3>
          <dl className="[&>div]:border-b [&>div]:border-review-line [&>div]:py-1 [&_dt]:text-[11px] [&_dt]:text-review-muted [&_dd]:mt-1 [&_dd]:text-sm">
            <div>
              <dt>Full name</dt>
              <dd>{registration.name}</dd>
            </div>
            <div>
              <dt>Student ID</dt>
              <dd>{registration.id}</dd>
            </div>
            <div>
              <dt>Declared year</dt>
              <dd>Year {registration.year}</dd>
            </div>
          </dl>
          <p className="text-xs text-review-muted">Verify the name, ID, year, and current term.</p>
        </>
      )}
    </section>
  )
}

function Application({
  registration,
  onDecision,
  onBack,
  focusOnOpen,
}: {
  registration: Registration
  onDecision: (id: string, status: 'APPROVED' | 'REJECTED', year: number, reason: string) => void
  onBack: () => void
  focusOnOpen: boolean
}) {
  const [year, setYear] = useState(registration.year)
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
    onDecision(registration.id, 'REJECTED', registration.year, reason.trim())
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
          <small>Submitted Nov 20, 1:58 PM · sample</small>
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
          <button
            className="flex min-h-[220px] w-full flex-col items-start justify-center gap-3 border border-review-line bg-review-selected p-6 text-left [&>span]:text-sm [&_small]:text-xs [&_small]:text-review-muted"
            onClick={() => documentRef.current?.showModal()}
            aria-label={`Open student profile for ${registration.name}`}
          >
            <span>Student profile preview</span>
            <small>Sample document placeholder</small>
          </button>
        </section>
        <OcrPanel registration={registration} />
      </div>
      {registration.status === 'PENDING' ? (
        <div className="grid gap-6 border-t border-review-line pt-3 min-[761px]:gap-2">
          <div className="grid grid-cols-1 items-end gap-3 min-[761px]:grid-cols-2 min-[1301px]:grid-cols-[minmax(130px,216fr)_minmax(100px,256fr)_minmax(170px,216fr)] min-[1301px]:gap-6">
            <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]">
              Year level on approval
              <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
                {YEAR_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    Year {value}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-review-muted [&_small]:mt-1 [&_small]:block [&_small]:text-[11px]">
              Correct the year if needed.
              <small>Used for the year-level ballot.</small>
            </p>
            <button
              className="col-span-full min-h-12 border border-review-ink bg-review-ink px-3.5 py-2.5 text-sm text-review-paper hover:bg-[#263e17] min-[761px]:min-h-11 min-[1301px]:col-span-1"
              onClick={() => onDecision(registration.id, 'APPROVED', year, '')}
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
              />
              <button
                className="min-h-12 border border-review-error bg-review-paper px-3.5 py-2.5 text-sm text-review-error hover:bg-[#f5e4d4] min-[761px]:min-h-11"
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
          {registration.reason && <p>Reason: {registration.reason}</p>}
          <p className="text-xs text-review-muted">
            Sample decision only. No live registration was changed.
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
        <p>This preview uses sample data. No student document is connected.</p>
        <div className="mt-4 grid min-h-[300px] place-items-center border border-review-line bg-review-selected p-6">
          Document preview placeholder
        </div>
      </dialog>
    </article>
  )
}

export function RegistrationReview() {
  const [registrations, setRegistrations] = useState(SAMPLE_REGISTRATIONS)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<RegistrationStatus | 'ALL'>('PENDING')
  const [year, setYear] = useState('ALL')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(SAMPLE_REGISTRATIONS[0].id)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [notice, setNotice] = useState('')
  const queueRef = useRef<HTMLHeadingElement>(null)
  const pending = registrations.filter((item) => item.status === 'PENDING').length
  const filtered = registrations.filter(
    (item) =>
      (status === 'ALL' || item.status === status) &&
      (year === 'ALL' || item.year === Number(year)) &&
      `${item.name} ${item.email} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1))
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0]

  function resetView() {
    setPage(0)
    setMobileDetail(false)
  }
  function backToQueue() {
    setMobileDetail(false)
    requestAnimationFrame(() => queueRef.current?.focus())
  }
  function decide(
    id: string,
    nextStatus: 'APPROVED' | 'REJECTED',
    nextYear: number,
    reason: string,
  ) {
    const applicant = registrations.find((item) => item.id === id)
    if (!applicant || applicant.status !== 'PENDING') return
    setRegistrations((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              year: nextYear,
              reason: reason || undefined,
            }
          : item,
      ),
    )
    setNotice(
      `Sample: ${applicant.name} ${nextStatus === 'APPROVED' ? `approved for Year ${nextYear}` : 'rejected'}. No live registration was changed.`,
    )
    backToQueue()
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-review-paper font-[Arial,Helvetica,sans-serif] text-[13px] leading-normal text-review-ink scheme-light min-[1001px]:grid-cols-[224px_minmax(0,1fr)] min-[1301px]:grid-cols-[272px_minmax(0,1fr)] [&_button]:cursor-pointer [&_button]:rounded-none [&_select]:cursor-pointer [&_select]:rounded-none [&_input]:rounded-none [&_textarea]:rounded-none [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-review-ink">
      <a
        className="fixed top-2 left-2 z-10 -translate-y-[150%] bg-review-ink p-3 text-review-paper focus:translate-y-0"
        href="#review-main"
      >
        Skip to registration review
      </a>
      <aside
        className="flex items-center justify-between gap-4 border border-review-line p-4 min-[761px]:px-6 min-[1001px]:min-h-dvh min-[1001px]:flex-col min-[1001px]:items-stretch min-[1001px]:justify-start min-[1001px]:px-4 min-[1001px]:py-6 [&_nav]:hidden min-[761px]:[&_nav]:block min-[1001px]:[&_nav]:grid min-[1001px]:[&_nav]:gap-2"
        aria-label="Commission admin"
      >
        <div className="flex min-h-10 items-center gap-3 min-[1001px]:border-b min-[1001px]:border-review-line min-[1001px]:pb-4 [&_img]:size-[33px] [&_img]:shrink-0 [&_img]:object-contain [&_span]:font-editorial [&_span]:text-lg [&_span]:leading-[26px] min-[1301px]:[&_span]:text-[22px] [&_small]:block [&_small]:text-[10px] [&_small]:text-review-muted">
          <Image
            src="/comelec-seal.png"
            alt="SSC COMELEC seal"
            loading="eager"
            width={33}
            height={33}
          />
          <div>
            <span>SSC COMELEC</span>
            <small>COMMISSION ADMIN</small>
          </div>
        </div>
        <nav aria-label="Admin navigation">
          {['Dashboard', 'Registrations', 'Ballot audit', 'Results', 'Admins', 'Activity log'].map(
            (label) =>
              label === 'Registrations' ? (
                <Link
                  key={label}
                  href="/admin/registrations"
                  aria-current="page"
                  className="flex min-h-11 justify-between gap-6 bg-review-ink p-3 text-sm text-[#effed4] no-underline [&_span]:text-xs"
                >
                  {label}
                  <span>{pending}</span>
                </Link>
              ) : (
                <span
                  key={label}
                  className="hidden min-h-11 p-3 text-sm min-[1001px]:block"
                  title="Not included in this UI preview"
                >
                  {label}
                </span>
              ),
          )}
        </nav>
        <div className="mt-auto hidden gap-1 border-t border-review-line pt-4 text-xs min-[1001px]:grid [&_small]:text-[10px] [&_small]:text-review-muted">
          <small>UI PREVIEW</small>
          <span>Sample admin workspace</span>
        </div>
      </aside>
      <main
        id="review-main"
        className={`group min-w-0 px-4 py-6 min-[761px]:p-6 min-[1301px]:px-10 min-[1301px]:pb-10 ${mobileDetail ? 'is-detail' : ''}`}
      >
        <header className="[&_p]:text-[11px] [&_p]:leading-4 [&_p]:text-review-muted [&_h1]:my-1.5 [&_h1]:font-display [&_h1]:text-[clamp(30px,8.5vw,40px)] [&_h1]:leading-[1.15] [&_h1]:italic min-[761px]:[&_h1]:my-0.5 min-[761px]:[&_h1]:text-5xl min-[761px]:[&_h1]:leading-[1.1] [&_span]:text-review-muted">
          <p>COMMISSION ADMIN</p>
          <h1>Registration review</h1>
          <span>{pending} applications awaiting review</span>
        </header>
        <p className="pt-2 text-[11px] text-review-muted">
          UI preview · sample data. Decisions reset when this page reloads.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 max-[761px]:group-[.is-detail]:hidden min-[761px]:grid-cols-[minmax(0,1fr)_180px_130px] min-[761px]:gap-4 min-[1301px]:grid-cols-[minmax(0,1fr)_232px_160px]">
          <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px] col-span-full min-[761px]:col-span-1">
            Search applicants
            <input
              type="search"
              placeholder="Name or organizational email"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                resetView()
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]">
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as RegistrationStatus | 'ALL')
                resetView()
              }}
            >
              <option value="ALL">All statuses</option>
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]} (
                  {registrations.filter((item) => item.status === value).length})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-review-muted min-[761px]:text-[11px] [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:border [&_input]:border-review-line [&_input]:bg-review-paper [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-review-ink [&_input::placeholder]:text-review-muted [&_select]:min-h-11 [&_select]:w-full [&_select]:min-w-0 [&_select]:border [&_select]:border-review-line [&_select]:bg-review-paper [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-base [&_select]:text-review-ink min-[761px]:[&_input]:min-h-[42px] min-[761px]:[&_input]:text-[13px] min-[761px]:[&_select]:min-h-[42px] min-[761px]:[&_select]:text-[13px]">
            Year level
            <select
              value={year}
              onChange={(event) => {
                setYear(event.target.value)
                resetView()
              }}
            >
              <option value="ALL">All years</option>
              {YEAR_LEVELS.map((value) => (
                <option key={value} value={value}>
                  Year {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <output className="block text-xs not-empty:py-3">{notice}</output>
        <div className="mt-4 min-[761px]:grid min-[761px]:grid-cols-[240px_minmax(0,1fr)] min-[761px]:items-start min-[761px]:gap-4 min-[1301px]:grid-cols-[280px_minmax(0,1fr)] min-[1301px]:gap-6">
          <section
            className="min-w-0 border border-review-line max-[761px]:group-[.is-detail]:hidden [&_ul]:list-none [&_ul]:p-0 [&_li]:border-t [&_li]:border-review-line [&_li_button]:flex [&_li_button]:w-full [&_li_button]:flex-col [&_li_button]:gap-1 [&_li_button]:p-4 [&_li_button]:text-left [&_li_button:hover]:bg-review-selected min-[761px]:[&_li_button]:gap-0.5 min-[761px]:[&_li_button]:px-3 min-[761px]:[&_li_button]:py-2.5 [&_li_button>span:not(:first-child)]:text-xs [&_li_button>span:not(:first-child)]:text-review-muted [&_li_button>span]:wrap-anywhere"
            aria-labelledby="queue-heading"
          >
            <header className="p-3 [&_h2]:text-[13px] [&_h2]:leading-5 [&_h2]:font-medium [&_p]:mt-1 [&_p]:text-[11px] [&_p]:text-review-muted">
              <h2 id="queue-heading" tabIndex={-1} ref={queueRef}>
                {status === 'PENDING' ? 'Awaiting review' : 'Applications'}
              </h2>
              <p>
                {filtered.length} {status === 'PENDING' ? 'pending applications' : 'applications'}
              </p>
            </header>
            {visible.length ? (
              <ul>
                {visible.map((item) => (
                  <li key={item.id}>
                    <button
                      className={selected?.id === item.id ? 'bg-review-selected' : ''}
                      aria-pressed={selected?.id === item.id}
                      onClick={() => {
                        setSelectedId(item.id)
                        setMobileDetail(true)
                      }}
                    >
                      <span className="font-editorial text-lg leading-6">{item.name}</span>
                      <span>
                        {item.id} · Year {item.year}
                      </span>
                      <span className="text-xs min-[761px]:!text-[10px]">
                        {item.email} · {statusLabels[item.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-review-muted">No applications match these filters.</p>
            )}
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-review-line px-4 py-3 text-xs text-review-muted min-[761px]:px-3 [&>div]:flex [&>div]:flex-wrap [&>div]:gap-3">
              <span>
                {filtered.length
                  ? `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`
                  : '0 applications'}
              </span>
              <div>
                {currentPage > 0 && (
                  <button
                    className="min-h-11 border-0 bg-transparent p-0 text-review-ink underline underline-offset-3 min-[761px]:min-h-7"
                    aria-label="Previous applicants"
                    onClick={() => {
                      setPage(currentPage - 1)
                      setMobileDetail(false)
                    }}
                  >
                    ← Previous
                  </button>
                )}
                {(currentPage + 1) * PAGE_SIZE < filtered.length && (
                  <button
                    className="min-h-11 border-0 bg-transparent p-0 text-review-ink underline underline-offset-3 min-[761px]:min-h-7"
                    onClick={() => {
                      setPage(currentPage + 1)
                      setMobileDetail(false)
                    }}
                  >
                    Next applicants →
                  </button>
                )}
              </div>
            </footer>
          </section>
          {selected ? (
            <Application
              key={selected.id}
              registration={selected}
              onDecision={decide}
              onBack={backToQueue}
              focusOnOpen={mobileDetail}
            />
          ) : (
            <div className="hidden p-6 text-review-muted min-[761px]:block">
              Select different filters to find an application.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
