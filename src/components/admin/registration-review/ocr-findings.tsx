import { CURRENT_TERM } from '@/election'
import type { Registration } from './types'

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
  return (
    <section className="[&>p]:py-2" aria-label="OCR findings">
      <div className="flex items-center justify-between gap-2 border-b border-review-line pb-2 text-review-muted [&_h3]:text-xs [&_h3]:font-medium min-[761px]:[&_h3]:text-[11px] [&_span]:text-xs">
        <h3>OCR FINDINGS</h3>
        <span>{available ? 'Findings available' : processing ? 'Processing' : 'Unavailable'}</span>
      </div>
      {available ? (
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
                <span className={!row.matches ? 'text-xs text-review-error' : undefined}>
                  {row.matches ? 'Match' : 'Doesn’t match'}
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
