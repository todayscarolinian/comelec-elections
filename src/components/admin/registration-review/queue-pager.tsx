import { ChevronLeft, ChevronRight } from 'lucide-react'

export const PAGE_SIZES = [10, 20, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]

/** First, last, and the pages around the current one, with gaps marked by null. */
export function pageItems(page: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index)
  const pages = [...new Set([0, page - 1, page, page + 1, count - 1])]
    .filter((item) => item >= 0 && item < count)
    .sort((a, b) => a - b)
  return pages.flatMap((item, index) =>
    index > 0 && item - pages[index - 1] > 1 ? [null, item] : [item],
  )
}

const pageButton =
  'grid min-h-11 min-w-11 place-items-center text-xs text-review-ink hover:bg-review-selected disabled:cursor-not-allowed disabled:text-review-line disabled:hover:bg-transparent min-[761px]:min-h-7 min-[761px]:min-w-7'

export function QueuePager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: PageSize
  total: number
  onPage: (page: number) => void
  onPageSize: (size: PageSize) => void
}) {
  const count = Math.max(1, Math.ceil(total / pageSize))
  return (
    <footer className="grid gap-2 border-t border-review-line px-4 py-3 text-xs text-review-muted min-[761px]:px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {total
            ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total}`
            : '0 applications'}
        </span>
        <label className="flex items-center gap-1.5">
          Show
          <select
            className="min-h-11 border border-review-line bg-review-paper px-1.5 text-xs text-review-ink min-[761px]:min-h-7"
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value) as PageSize)}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      {count > 1 && (
        <nav
          aria-label="Queue pages"
          className="flex flex-wrap items-center justify-center gap-0.5"
        >
          <button
            type="button"
            className={pageButton}
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          {pageItems(page, count).map((item, index) =>
            item === null ? (
              <span key={`gap-${index}`} aria-hidden="true" className="min-w-5 text-center">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Page ${item + 1}`}
                aria-current={item === page ? 'page' : undefined}
                className={`${pageButton} aria-[current=page]:bg-review-ink aria-[current=page]:font-semibold aria-[current=page]:text-review-paper`}
                onClick={() => onPage(item)}
              >
                {item + 1}
              </button>
            ),
          )}
          <button
            type="button"
            className={pageButton}
            aria-label="Next page"
            disabled={page >= count - 1}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </nav>
      )}
    </footer>
  )
}
