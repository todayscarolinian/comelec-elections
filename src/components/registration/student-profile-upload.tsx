'use client'

import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { getStudentProfileValidationError, STUDENT_PROFILE_MIME_TYPES } from '@/lib/student-profile'
import { useTRPC } from '@/lib/trpc/client'

type StudentProfileUploadProps = {
  onUploaded: (path: string) => void
  onUploadStart?: () => void
  disabled?: boolean
}

export function StudentProfileUpload({
  onUploaded,
  onUploadStart,
  disabled = false,
}: Readonly<StudentProfileUploadProps>) {
  const trpc = useTRPC()
  const hintId = useId()
  const createUpload = useMutation(trpc.registration.createStudentProfileUpload.mutationOptions())
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>()
  const [uploaded, setUploaded] = useState(false)

  async function upload(file: File) {
    onUploadStart?.()
    const validationError = getStudentProfileValidationError(file)

    if (validationError) {
      setError(validationError)
      setUploaded(false)
      return
    }

    setError(undefined)
    setUploaded(false)
    setIsUploading(true)

    try {
      const { path, signedUrl } = await createUpload.mutateAsync()

      const response = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error('Storage upload failed')
      }

      setUploaded(true)
      onUploaded(path)
    } catch {
      setError('Unable to upload the Student Profile. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Student Profile
        <input
          type="file"
          aria-describedby={hintId}
          accept={STUDENT_PROFILE_MIME_TYPES.join(',')}
          disabled={disabled || isUploading}
          className="mt-2 block w-full min-w-0 rounded-xl border border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:font-medium file:text-zinc-900 hover:file:bg-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:file:bg-zinc-700 dark:file:text-zinc-100 dark:hover:file:bg-zinc-600 dark:focus-visible:outline-emerald-400"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) void upload(file)
          }}
        />
      </label>
      <p id={hintId} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        In ISMIS, click your avatar in the top right, then My Profile. Upload a screenshot that
        shows your name, student ID, Year Level and current term. JPEG, PNG or WebP, up to 5 MB.
      </p>

      {isUploading && (
        <output className="block text-sm text-zinc-600 dark:text-zinc-400">
          Uploading Student Profile...
        </output>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {uploaded && (
        <output className="block text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Student Profile uploaded.
        </output>
      )}
    </div>
  )
}
