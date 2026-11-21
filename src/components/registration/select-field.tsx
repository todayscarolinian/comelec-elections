type SelectFieldProps<T extends string> = {
  id: string
  label: string
  placeholder: string
  options: readonly T[]
  labels: Readonly<Record<T, string>>
  value: string
  disabled: boolean
  hint?: string
  onChange: (value: string) => void
}

/** A required choice from a fixed list, styled for the Registration pages. */
export function SelectField<T extends string>({
  id,
  label,
  placeholder,
  options,
  labels,
  value,
  disabled,
  hint,
  onChange,
}: Readonly<SelectFieldProps<T>>) {
  const hintId = `${id}-hint`
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-[#324e1f]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        required
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-14 w-full border border-[#b6c89f] bg-transparent px-4 py-3 text-base text-[#324e1f] disabled:opacity-60"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="text-sm leading-relaxed text-[#56654a]">
          {hint}
        </p>
      )}
    </div>
  )
}
