import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

type FilterOption = { value: string; label: string }

export function CandidateFilter({
  label,
  options,
  value,
  className,
  onChange,
}: {
  label: string
  options: readonly FilterOption[]
  value: string
  className: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const selectedOption = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    trigger.current?.focus({ preventScroll: true })
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return

    selectedOption.current?.focus({ preventScroll: true })

    function dismissWhenOutside(event: Event) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }

    document.addEventListener('pointerdown', dismissWhenOutside)
    document.addEventListener('focusin', dismissWhenOutside)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissWhenOutside)
      document.removeEventListener('focusin', dismissWhenOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open, close])

  return (
    <div ref={root} className="relative min-w-0">
      <span id={`${id}-label`} className="mb-2 block text-xs text-comelec-olive">
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-expanded={open}
        aria-controls={`${id}-options`}
        className={`${className} flex cursor-pointer items-center justify-between gap-3 text-start font-medium aria-expanded:border-comelec-forest`}
        onClick={() => setOpen(!open)}
      >
        <span id={`${id}-value`}>{options.find((option) => option.value === value)?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-comelec-olive motion-safe:transition-transform motion-safe:duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <ul
        id={`${id}-options`}
        aria-labelledby={`${id}-label`}
        aria-hidden={!open}
        inert={!open}
        className={`absolute start-0 top-full z-10 mt-1.5 max-h-64 w-full space-y-0.5 overflow-y-auto overscroll-contain rounded-md border border-comelec-sage bg-comelec-cream p-1.5 text-comelec-forest shadow-[0_8px_24px_rgb(10_20_5/14%)] motion-safe:transition-[opacity,translate,visibility] motion-safe:duration-150 motion-safe:ease-out ${open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'}`}
      >
        {options.map((option) => {
          const selected = option.value === value
          return (
            <li key={option.value}>
              <button
                ref={selected ? selectedOption : undefined}
                type="button"
                aria-pressed={selected}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-start text-sm font-medium hover:bg-comelec-sage/25 focus-visible:outline-offset-[-2px]! aria-pressed:bg-comelec-sage-soft motion-safe:transition-colors"
                onClick={() => {
                  close()
                  onChange(option.value)
                }}
              >
                {option.label}
                {selected && <Check aria-hidden="true" className="size-4 shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
