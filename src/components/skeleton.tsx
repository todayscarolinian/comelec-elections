import type { ReactNode } from 'react'

/** A single placeholder block. Decorative: the surrounding status carries the label. */
export function Bone({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-comelec-sage/45 motion-reduce:animate-none ${className}`}
    />
  )
}

/** Announces one loading message to assistive tech while the bones stay hidden. */
export function LoadingRegion({
  label,
  className = 'min-w-0',
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div aria-busy="true" className={className}>
      <output className="sr-only">{label}</output>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export function Repeat({
  count,
  children,
}: {
  count: number
  children: (index: number) => ReactNode
}) {
  return <>{Array.from({ length: count }, (_, index) => children(index))}</>
}

// Varied widths read as text rather than a grid of identical bars.
export const boneWidths = ['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5', 'w-3/4']
