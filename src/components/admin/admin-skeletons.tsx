import type { ReactNode } from 'react'
import { AdminPage } from './admin-ui'

/** A single placeholder block. Decorative: the surrounding status carries the label. */
export function Bone({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-review-line/45 motion-reduce:animate-none ${className}`}
    />
  )
}

/** Announces one loading message to assistive tech while the bones stay hidden. */
function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true" className="min-w-0">
      <output className="sr-only">{label}</output>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

/** Uses the real AdminPage header so the title doesn't shift when data arrives. */
function PageFrame({
  title,
  label,
  aside = false,
  children,
}: {
  title: string
  label: string
  aside?: boolean
  children: ReactNode
}) {
  return (
    <AdminPage
      title={title}
      aside={
        aside && (
          <div aria-hidden="true" className="grid justify-items-end gap-2">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-20" />
          </div>
        )
      }
    >
      <LoadingRegion label={label}>{children}</LoadingRegion>
    </AdminPage>
  )
}

function Rows({ count, children }: { count: number; children: (index: number) => ReactNode }) {
  return <>{Array.from({ length: count }, (_, index) => children(index))}</>
}

// Varied widths read as text rather than a grid of identical bars.
const widths = ['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5', 'w-3/4']

export function DashboardSkeleton() {
  return (
    <PageFrame title="Dashboard" label="Loading dashboard…" aside>
      <div className="flex flex-wrap items-center justify-between gap-4 bg-review-ink px-5 py-6">
        <div className="grid gap-2">
          <Bone className="h-2.5 w-24 bg-[#effed4]/30" />
          <Bone className="h-8 w-56 bg-[#effed4]/30" />
          <Bone className="h-3 w-40 bg-[#effed4]/30" />
        </div>
        <Bone className="h-13 w-full bg-[#effed4]/30 min-[761px]:w-[250px]" />
      </div>

      <div className="mt-6 grid gap-6 border-b border-review-line pb-4 min-[761px]:grid-cols-3">
        <Rows count={3}>
          {(index) => (
            <div key={index} className="grid gap-2">
              <Bone className="h-3 w-24" />
              <Bone className="h-11 w-28" />
              <Bone className="h-3 w-36" />
            </div>
          )}
        </Rows>
      </div>

      <div className="mt-5 grid gap-6 min-[1001px]:grid-cols-[minmax(0,1fr)_minmax(280px,426px)]">
        <div>
          <Bone className="h-8 w-56" />
          <Bone className="mt-3 h-3 w-72 max-w-full" />
          <Rows count={3}>
            {(index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 border-b border-review-line py-4"
              >
                <div className="grid flex-1 gap-2">
                  <Bone className={`h-5 ${widths[index]}`} />
                  <Bone className="h-3 w-36" />
                </div>
                <Bone className="h-3 w-20" />
              </div>
            )}
          </Rows>
          <Bone className="mt-3 h-[52px] w-[252px] max-w-full" />
        </div>
        <div className="self-start border border-review-line px-5 py-6">
          <Bone className="h-2.5 w-28" />
          <Bone className="mt-2 h-7 w-24" />
          <Bone className="mt-2 h-3 w-36" />
          <hr className="my-5 border-review-line" />
          <Bone className="h-2.5 w-24" />
          <Bone className="mt-2 h-7 w-24" />
          <Bone className="mt-2 h-3 w-52 max-w-full" />
          <Bone className="mt-2 h-3 w-32" />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-review-line pb-2">
          <Bone className="h-8 w-44" />
          <Bone className="h-3 w-24" />
        </div>
        <Rows count={2}>
          {(index) => (
            <div
              key={index}
              className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 border-b border-review-line py-3 min-[761px]:grid-cols-[136px_minmax(0,1fr)_minmax(0,1fr)]"
            >
              <Bone className="h-3 w-14" />
              <Bone className="h-3 w-40" />
              <Bone className="col-start-2 h-3 w-32 min-[761px]:col-start-auto" />
            </div>
          )}
        </Rows>
      </div>
    </PageFrame>
  )
}

/** Table-shaped placeholder; place it where the table will render, below any filters. */
export function TableSkeleton({
  label,
  columns,
  rows = 6,
}: {
  label: string
  columns: number
  rows?: number
}) {
  return (
    <LoadingRegion label={label}>
      <div className="grid gap-4 border-b border-review-line pb-2" style={gridColumns(columns)}>
        <Rows count={columns}>{(index) => <Bone key={index} className="h-3 w-16" />}</Rows>
      </div>
      <Rows count={rows}>
        {(row) => (
          <div
            key={row}
            className="grid items-start gap-4 border-b border-review-line py-3"
            style={gridColumns(columns)}
          >
            <Rows count={columns}>
              {(column) => (
                <div key={column} className="grid gap-1.5">
                  <Bone className={`h-3.5 ${widths[(row + column) % widths.length]}`} />
                  {column === 0 && <Bone className="h-3 w-4/5" />}
                </div>
              )}
            </Rows>
          </div>
        )}
      </Rows>
    </LoadingRegion>
  )
}

function gridColumns(columns: number) {
  return { gridTemplateColumns: `minmax(0,1.6fr) repeat(${columns - 1}, minmax(0,1fr))` }
}

export function ResultsSkeleton() {
  return (
    <PageFrame title="Results" label="Loading results…">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-review-line px-5 py-5">
        <div className="grid flex-1 gap-2">
          <Bone className="h-4 w-96 max-w-full" />
          <Bone className="h-3 w-48" />
        </div>
        <Bone className="h-11 w-40" />
      </div>
      <div className="mt-6 grid gap-4 border-b border-review-line pb-4 min-[761px]:grid-cols-3">
        <Rows count={3}>
          {(index) => (
            <div key={index} className="grid gap-2">
              <Bone className="h-3 w-32" />
              <Bone className="h-7 w-16" />
            </div>
          )}
        </Rows>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-8 max-[42rem]:grid-cols-1">
        <Rows count={2}>
          {(question) => (
            <div key={question}>
              <Bone className="h-7 w-48" />
              <Bone className="mt-3 mb-4 h-3 w-40" />
              <div className="grid gap-4">
                <Rows count={3}>
                  {(candidate) => (
                    <div key={candidate} className="grid gap-1.5">
                      <div className="flex justify-between gap-4">
                        <Bone className={`h-3.5 ${widths[candidate + question]}`} />
                        <Bone className="h-3.5 w-16" />
                      </div>
                      <Bone className="h-1.5 w-full" />
                    </div>
                  )}
                </Rows>
              </div>
            </div>
          )}
        </Rows>
      </div>
    </PageFrame>
  )
}

export function RegistrationReviewSkeleton() {
  return (
    <PageFrame title="Registration review" label="Loading registrations…">
      <div className="grid grid-cols-2 gap-3 min-[761px]:grid-cols-[minmax(0,1fr)_180px_130px] min-[761px]:gap-4 min-[1301px]:grid-cols-[minmax(0,1fr)_232px_160px]">
        <Rows count={3}>
          {(index) => (
            <div
              key={index}
              className={`grid gap-1.5 ${index === 0 ? 'col-span-full min-[761px]:col-span-1' : ''}`}
            >
              <Bone className="h-3 w-24" />
              <Bone className="h-[42px] w-full" />
            </div>
          )}
        </Rows>
      </div>
      <div className="mt-8 min-[761px]:grid min-[761px]:grid-cols-[240px_minmax(0,1fr)] min-[761px]:items-start min-[761px]:gap-4 min-[1301px]:grid-cols-[280px_minmax(0,1fr)] min-[1301px]:gap-6">
        <div className="border border-review-line">
          <div className="grid gap-2 p-3">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-3 w-36" />
          </div>
          <Rows count={5}>
            {(index) => (
              <div key={index} className="grid gap-2 border-t border-review-line px-3 py-3">
                <Bone className={`h-5 ${widths[index]}`} />
                <Bone className="h-3 w-28" />
              </div>
            )}
          </Rows>
        </div>
        <div className="hidden border border-review-line p-5 min-[761px]:block">
          <Bone className="h-7 w-56" />
          <Bone className="mt-2 h-3 w-44" />
          <Bone className="mt-2 h-3 w-36" />
          <div className="mt-6 grid gap-6 min-[1101px]:grid-cols-2">
            <Bone className="aspect-[3/2] w-full" />
            <div className="grid content-start gap-4">
              <Rows count={4}>
                {(index) => (
                  <div key={index} className="grid gap-2 border-b border-review-line pb-2">
                    <Bone className="h-3 w-20" />
                    <Bone className={`h-4 ${widths[index]}`} />
                  </div>
                )}
              </Rows>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-4">
            <Bone className="h-[42px] w-52" />
            <Bone className="h-11 w-52" />
          </div>
        </div>
      </div>
    </PageFrame>
  )
}
