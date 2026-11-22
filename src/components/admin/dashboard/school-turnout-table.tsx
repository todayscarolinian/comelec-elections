import type { SchoolTotals } from '@/server/trpc/api/v1/admin/schema'

const formatCount = (count: number) => count.toLocaleString('en-US')

/** Counted and Held Ballots per School, from admin.getDashboard. */
export function SchoolTurnoutTable({ rows }: { rows: readonly SchoolTotals[] }) {
  return (
    <section aria-labelledby="school-turnout-heading" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-review-line pb-2">
        <h2 id="school-turnout-heading" className="font-display text-[28px] italic">
          Turnout by School
        </h2>
        <span className="text-xs text-review-muted">
          Counted ballots have an approved registration
        </span>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="text-review-muted">
          <tr className="border-b border-review-line">
            <th scope="col" className="py-2 font-normal">
              School
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              Counted
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              Held
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.school} className="border-b border-review-line">
              <th scope="row" className="py-3 font-normal">
                {row.label}
              </th>
              <td className="py-3 text-right tabular-nums">{formatCount(row.counted)}</td>
              <td className="py-3 text-right text-review-muted tabular-nums">
                {formatCount(row.heldPending + row.heldRejected)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
