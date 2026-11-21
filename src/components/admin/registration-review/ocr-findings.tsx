import { Check, CircleCheck, TriangleAlert, X } from 'lucide-react'
import { CURRENT_TERM } from '@/election'
import type { Registration } from './types'

/** Compact OCR status for a queue row, so mismatches stand out before an application is opened. */
export function OcrIndicator({ registration }: { registration: Registration }) {
  const ocr = registration.ocrResult
  const base =
    'inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 text-[10px] leading-none font-medium'
  if (registration.ocrStatus === 'PENDING') {
    return (
      <span className={`${base} border border-review-line text-review-muted`}>OCR pending</span>
    )
  }
  if (registration.ocrStatus !== 'DONE' || !ocr) {
    return (
      <span className={`${base} border border-review-line text-review-muted`}>
        <span aria-hidden="true">No OCR</span>
        <span className="sr-only">OCR unavailable</span>
      </span>
    )
  }
  const mismatches = Object.values(ocr.matches).filter((matches) => !matches).length
  return mismatches ? (
    <span className={`${base} bg-[#f7e3dc] text-review-error`}>
      <TriangleAlert aria-hidden="true" className="size-3" />
      <span aria-hidden="true">OCR · {mismatches} off</span>
      <span className="sr-only">
        OCR: {mismatches} {mismatches === 1 ? 'field doesn’t' : 'fields don’t'} match
      </span>
    </span>
  ) : (
    <span className={`${base} border border-review-ink/30 text-review-ink`}>
      <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
      <span aria-hidden="true">OCR</span>
      <span className="sr-only">OCR: all fields match</span>
    </span>
  )
}

export function OcrFindings({ registration }: { registration: Registration }) {
  const ocr = registration.ocrResult
  const available = registration.ocrStatus === 'DONE' && ocr !== null
  const processing = registration.ocrStatus === 'PENDING'
  const rows = available
    ? [
        {
          label: 'Full name',
          expected: registration.name,
          read: ocr.fields.name,
          matches: ocr.matches.name,
        },
        {
          label: 'Student ID',
          expected: registration.studentId,
          read: ocr.fields.studentId,
          matches: ocr.matches.studentId,
        },
        {
          label: 'Year level',
          expected: `Year ${registration.yearLevel}`,
          read: ocr.fields.yearLevel,
          matches: ocr.matches.yearLevel,
        },
        { label: 'Term', expected: CURRENT_TERM, read: ocr.fields.term, matches: ocr.matches.term },
      ]
    : []
  const mismatches = rows.filter((row) => !row.matches).length
  return (
    <section className="[&>p]:py-2" aria-label="OCR findings">
      <div className="flex items-center justify-between gap-2 border-b border-review-line pb-2 text-review-muted">
        <h3 className="text-xs font-medium min-[761px]:text-[11px]">OCR FINDINGS</h3>
        {available ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium ${mismatches ? 'bg-[#f7e3dc] text-review-error' : 'bg-review-selected text-review-ink'}`}
          >
            {mismatches ? (
              <TriangleAlert aria-hidden="true" className="size-3.5" />
            ) : (
              <CircleCheck aria-hidden="true" className="size-3.5" />
            )}
            {mismatches
              ? `${mismatches} of ${rows.length} need a closer look`
              : `All ${rows.length} fields match`}
          </span>
        ) : (
          <span className="text-xs">{processing ? 'Processing' : 'Unavailable'}</span>
        )}
      </div>
      {available ? (
        <>
          <p className="text-xs text-review-muted">
            Check the readings against the screenshot before deciding.
          </p>
          <div className="grid grid-cols-2 gap-4 px-3 pb-1.5 text-[11px] tracking-[0.04em] text-review-muted uppercase">
            <span>Expected</span>
            <span>Read from screenshot</span>
          </div>
          <ul className="border-t border-review-line">
            {rows.map((row) => (
              <li
                key={row.label}
                className={`border-b border-l-2 border-b-review-line px-3 py-2.5 ${row.matches ? 'border-l-transparent' : 'border-l-review-error bg-[#f7e3dc]/45'}`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-review-muted min-[761px]:text-[11px]">
                    {row.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${row.matches ? 'text-review-muted' : 'text-review-error'}`}
                  >
                    {row.matches ? (
                      <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
                    ) : (
                      <X aria-hidden="true" className="size-3" strokeWidth={2.5} />
                    )}
                    {row.matches ? 'Match' : 'Doesn’t match'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm wrap-anywhere min-[761px]:text-[13px]">
                  <span>{row.expected}</span>
                  <span className={row.read ? 'font-medium' : 'text-review-muted italic'}>
                    {row.read || 'Not read'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="border-b border-review-line py-3 text-[13px] text-review-muted">
            {processing
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
              <dd>{registration.studentId}</dd>
            </div>
            <div>
              <dt>Declared year</dt>
              <dd>Year {registration.yearLevel}</dd>
            </div>
          </dl>
          <p className="text-xs text-review-muted">Verify the name, ID, year, and current term.</p>
        </>
      )}
    </section>
  )
}
