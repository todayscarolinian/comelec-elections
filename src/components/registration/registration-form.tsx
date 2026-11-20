'use client'

import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { YEAR_LEVELS, type YearLevel } from '@/server/trpc/api/v1/registration/schema'
import { StudentProfileUpload } from './student-profile-upload'
import { YearLevelSelect } from './year-level-select'

type RegistrationFormProps = {
  initialYearLevel?: string
  resubmitting: boolean
  onSubmitted: (yearLevel: YearLevel, fileName?: string) => void
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
  const [uploadedFileName, setUploadedFileName] = useState<string>()
  const submit = useMutation({
    ...trpc.registration.submit.mutationOptions(),
    onSuccess: (_data, input) => onSubmitted(input.yearLevel, uploadedFileName),
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
      className="space-y-6"
      aria-label="Registration"
      aria-busy={submit.isPending}
    >
      <YearLevelSelect
        value={selectedYear}
        disabled={submit.isPending}
        onValueChange={setYearLevel}
      />

      <StudentProfileUpload
        disabled={submit.isPending}
        onUploadStart={() => {
          setStudentProfilePath('')
          setUploadedFileName(undefined)
          submit.reset()
        }}
        onFileSelected={setUploadedFileName}
        onUploaded={setStudentProfilePath}
      />

      <div className="space-y-4 pt-1">
        {submit.isError && (
          <p role="alert" className="text-sm text-review-error">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex h-[52px] w-full items-center justify-center px-7 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-comelec-forest ${
            canSubmit
              ? 'cursor-pointer bg-comelec-forest text-comelec-cream hover:bg-comelec-forest-dark active:translate-y-px'
              : 'cursor-not-allowed bg-comelec-sage/65 text-comelec-olive'
          }`}
        >
          {submit.isPending
            ? 'Submitting…'
            : resubmitting
              ? 'Resubmit registration'
              : 'Submit registration'}
        </button>
        <p className="text-sm leading-relaxed text-comelec-olive">
          {resubmitting
            ? 'Upload a corrected Student Profile. Resubmitting sends your registration back for COMELEC review.'
            : 'You can vote once COMELEC approves your registration.'}
        </p>
      </div>
    </form>
  )
}
