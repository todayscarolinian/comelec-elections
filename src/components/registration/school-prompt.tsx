'use client'

import { useMutation } from '@tanstack/react-query'
import { useId, useState, type FormEvent } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { SCHOOLS, SCHOOL_LABELS, isSchool } from '@/server/trpc/api/v1/registration/core/school'
import { SelectField } from './select-field'

type SchoolPromptProps = {
  /** Classes for the save button, so the prompt matches the page it appears on. */
  actionClassName: string
  onSaved: () => void
}

const errors: Readonly<Record<string, string>> = {
  CONFLICT: 'Your School is already recorded. Refresh to see it.',
  FORBIDDEN: 'Results have been released, so your School can no longer be added.',
  NOT_FOUND: 'Register before adding your School.',
}

/**
 * One-time question for people who registered before School was collected. Shown until their
 * Registration has a School; the server accepts the answer only once.
 */
export function SchoolPrompt({ actionClassName, onSaved }: Readonly<SchoolPromptProps>) {
  const trpc = useTRPC()
  const id = useId()
  const [school, setSchool] = useState('')
  const save = useMutation({
    ...trpc.registration.setSchool.mutationOptions(),
    onSuccess: onSaved,
    onError: (error) => {
      if (error.data?.code === 'CONFLICT') onSaved()
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isSchool(school) || save.isPending) return
    save.mutate({ school })
  }

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="space-y-4 border border-[#b6c89f] bg-[#f4ecd6] p-5"
    >
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="text-lg font-medium">
          Which School are you in?
        </h2>
        <p className="text-sm leading-relaxed text-[#56654a]">
          We now record each voter’s School for turnout statistics. You only need to answer once,
          and it does not change your ballot.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3" aria-busy={save.isPending}>
        <SelectField
          id={`${id}-school`}
          label="School"
          placeholder="Choose your School"
          options={SCHOOLS}
          labels={SCHOOL_LABELS}
          value={school}
          disabled={save.isPending}
          onChange={setSchool}
        />
        {save.isError && (
          <p role="alert" className="text-sm text-[#862f29]">
            {errors[save.error.data?.code ?? ''] ?? 'Unable to save your School. Please try again.'}
          </p>
        )}
        <button
          type="submit"
          disabled={!isSchool(school) || save.isPending}
          className={actionClassName}
        >
          {save.isPending ? 'Saving…' : 'Save School'}
        </button>
      </form>
    </section>
  )
}
