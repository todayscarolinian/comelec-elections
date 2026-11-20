'use client'

import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import {
  YEAR_LEVELS,
  YEAR_LEVEL_LABELS,
  type YearLevel,
} from '@/server/trpc/api/v1/registration/schema'
import { StudentProfileUpload } from './student-profile-upload'

type RegistrationFormProps = {
  initialYearLevel?: string
  resubmitting: boolean
  onSubmitted: (yearLevel: YearLevel) => void
  onSessionExpired: () => void
  onRefresh: () => void
}

export function RegistrationForm({
  initialYearLevel,
  resubmitting,
  onSubmitted,
  onSessionExpired,
  onRefresh,
}: Readonly<RegistrationFormProps>) {
  const trpc = useTRPC()
  const [yearLevel, setYearLevel] = useState(initialYearLevel ?? '')
  const [studentProfilePath, setStudentProfilePath] = useState('')
  const submit = useMutation({
    ...trpc.registration.submit.mutationOptions(),
    onSuccess: (_data, input) => onSubmitted(input.yearLevel),
    onError: (error) => {
      if (error.data?.code === 'UNAUTHORIZED') onSessionExpired()
      if (error.data?.code === 'FORBIDDEN' || error.data?.code === 'CONFLICT') onRefresh()
      if (error.data?.code === 'BAD_REQUEST') setStudentProfilePath('')
    },
  })
  const selectedYear = YEAR_LEVELS.find((level) => level === yearLevel)
  const canSubmit = !!selectedYear && !!studentProfilePath && !submit.isPending
  const errorMessage =
    submit.error?.data?.code === 'BAD_REQUEST'
      ? 'Please check your Year Level and upload your Student Profile again.'
      : submit.error?.data?.code === 'FORBIDDEN'
        ? 'Registration is closed. Refresh your status before trying again.'
        : submit.error?.data?.code === 'CONFLICT'
          ? 'Your registration has changed. Refresh your status before trying again.'
          : 'Unable to submit your registration. Please try again.'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || !selectedYear) return
    submit.mutate({ yearLevel: selectedYear, studentProfilePath })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7"
      aria-label="Registration"
      aria-busy={submit.isPending}
    >
      <div className="space-y-2">
        <label
          htmlFor="year-level"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Year Level
        </label>
        <select
          id="year-level"
          value={yearLevel}
          required
          aria-describedby="year-level-hint"
          disabled={submit.isPending}
          onChange={(event) => setYearLevel(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:outline-emerald-400"
        >
          <option value="" disabled>
            Choose your Year Level
          </option>
          {YEAR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {YEAR_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
        <p
          id="year-level-hint"
          className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
        >
          For information only. Your Year Level does not change your ballot.
        </p>
      </div>

      <StudentProfileUpload
        disabled={submit.isPending}
        onUploadStart={() => {
          setStudentProfilePath('')
          submit.reset()
        }}
        onUploaded={setStudentProfilePath}
      />

      <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {resubmitting
            ? 'Upload a corrected Student Profile. Resubmitting sends your registration back for Admin review.'
            : 'An Admin will review your Student Profile. You can return to this page to check your status.'}
        </p>
        {submit.isError && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="min-h-12 w-full whitespace-nowrap rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-zinc-50 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200 dark:focus-visible:outline-emerald-400"
        >
          {submit.isPending
            ? 'Submitting…'
            : resubmitting
              ? 'Resubmit registration'
              : 'Submit registration'}
        </button>
      </div>
    </form>
  )
}
