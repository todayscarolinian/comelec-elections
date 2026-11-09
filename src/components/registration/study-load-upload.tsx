'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getStudyLoadValidationError, STUDY_LOAD_MIME_TYPES } from '@/lib/study-load'
import { useTRPC } from '@/lib/trpc/client'

type StudyLoadUploadProps = {
  onUploaded: (path: string) => void
}

export function StudyLoadUpload({ onUploaded }: Readonly<StudyLoadUploadProps>) {
  const trpc = useTRPC()
  const createUpload = useMutation(trpc.registration.createStudyLoadUpload.mutationOptions())
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>()
  const [uploaded, setUploaded] = useState(false)

  async function upload(file: File) {
    const validationError = getStudyLoadValidationError(file)

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
      setError('Unable to upload the Study Load. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <label>
        Study Load
        <input
          type="file"
          accept={STUDY_LOAD_MIME_TYPES.join(',')}
          disabled={isUploading}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) void upload(file)
          }}
        />
      </label>

      {isUploading && <output>Uploading Study Load...</output>}
      {error && <p role="alert">{error}</p>}
      {uploaded && <output>Study Load uploaded.</output>}
    </div>
  )
}
