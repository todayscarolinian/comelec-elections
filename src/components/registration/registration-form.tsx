'use client'

import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import {
  YEAR_LEVELS,
  YEAR_LEVEL_LABELS,
  type YearLevel,
} from '@/server/trpc/api/v1/registration/schema'
import { registrationAction } from './registration-styles'
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
        <label htmlFor="year-level" className="block text-sm font-medium text-[#324e1f]">
          Year Level
        </label>
        <select
          id="year-level"
          value={yearLevel}
          required
          aria-describedby="year-level-hint"
          disabled={submit.isPending}
          onChange={(event) => setYearLevel(event.target.value)}
          className="min-h-14 w-full border border-[#b6c89f] bg-transparent px-4 py-3 text-base text-[#324e1f] disabled:opacity-60"
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
        <p id="year-level-hint" className="text-sm leading-relaxed text-[#56654a]">
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

      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-[#56654a]">
          {resubmitting
            ? 'Upload a corrected Student Profile. Resubmitting sends your registration back for Admin review.'
            : 'An Admin will review your Student Profile. You can return to this page to check your status.'}
        </p>
        {submit.isError && (
          <p role="alert" className="text-sm text-[#862f29]">
            {errorMessage}
          </p>
        )}
        <button type="submit" disabled={!canSubmit} className={`${registrationAction} w-full`}>
          {submit.isPending
            ? 'Submitting…'
            : resubmitting
              ? 'Resubmit registration'
              : 'Submit registration'}
        </button>
        <p className="text-sm leading-relaxed text-[#56654a]">
          By submitting, you agree to the{' '}
          <Link href="/terms" className="font-medium text-[#324e1f] underline underline-offset-4">
            Terms of Service
          </Link>{' '}
          and acknowledge the{' '}
          <Link href="/privacy" className="font-medium text-[#324e1f] underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </form>
  )
}
