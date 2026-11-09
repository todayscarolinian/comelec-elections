'use client'

import { useMutation } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { getStudentProfileValidationError, STUDENT_PROFILE_MIME_TYPES } from '@/lib/student-profile'
import { useTRPC } from '@/lib/trpc/client'

type StudentProfileUploadProps = {
  onUploaded: (path: string) => void
}

export function StudentProfileUpload({ onUploaded }: Readonly<StudentProfileUploadProps>) {
  const trpc = useTRPC()
  const hintId = useId()
  const createUpload = useMutation(trpc.registration.createStudentProfileUpload.mutationOptions())
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>()
  const [uploaded, setUploaded] = useState(false)

  async function upload(file: File) {
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
    <div>
      <label>
        Student Profile
        <input
          type="file"
          aria-describedby={hintId}
          accept={STUDENT_PROFILE_MIME_TYPES.join(',')}
          disabled={isUploading}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) void upload(file)
          }}
        />
      </label>
      <p id={hintId}>
        In ISMIS, click your avatar in the top right, then My Profile. Upload a screenshot that
        shows your name, student ID, Year Level and current term.
      </p>

      {isUploading && <output>Uploading Student Profile...</output>}
      {error && <p role="alert">{error}</p>}
      {uploaded && <output>Student Profile uploaded.</output>}
    </div>
  )
}
