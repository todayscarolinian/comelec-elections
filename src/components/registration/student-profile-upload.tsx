'use client'

import { useMutation } from '@tanstack/react-query'
import { useId, useRef, useState, type DragEvent } from 'react'
import { getStudentProfileValidationError, STUDENT_PROFILE_MIME_TYPES } from '@/lib/student-profile'
import { useTRPC } from '@/lib/trpc/client'

type StudentProfileUploadProps = {
  onUploaded: (path: string) => void
  onUploadStart?: () => void
  onFileSelected?: (fileName: string) => void
  disabled?: boolean
}

export function StudentProfileUpload({
  onUploaded,
  onUploadStart,
  onFileSelected,
  disabled = false,
}: Readonly<StudentProfileUploadProps>) {
  const trpc = useTRPC()
  const inputId = useId()
  const hintId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const createUpload = useMutation(trpc.registration.createStudentProfileUpload.mutationOptions())
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string>()
  const [uploaded, setUploaded] = useState(false)
  const [fileName, setFileName] = useState<string>()

  const isDisabled = disabled || isUploading

  async function upload(file: File) {
    onUploadStart?.()
    setFileName(file.name)
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
      onFileSelected?.(file.name)
      onUploaded(path)
    } catch {
      setError('Unable to upload the Student Profile. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!isDisabled) setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isDisabled) return
    const file = event.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-comelec-forest">
        Current student profile
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        aria-describedby={hintId}
        accept={STUDENT_PROFILE_MIME_TYPES.join(',')}
        disabled={isDisabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void upload(file)
        }}
      />

      <button
        type="button"
        aria-describedby={hintId}
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-[128px] w-full flex-col items-center justify-center gap-2 border border-dashed px-6 py-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-comelec-forest ${
          isDisabled
            ? 'cursor-not-allowed border-comelec-sage/70 opacity-60'
            : isDragging
              ? 'cursor-pointer border-comelec-forest bg-comelec-sage-soft'
              : 'cursor-pointer border-comelec-sage hover:border-comelec-forest hover:bg-comelec-sage-soft/50'
        }`}
      >
        <span className="text-base font-medium text-comelec-forest underline underline-offset-4">
          {uploaded && fileName ? 'Replace image' : 'Choose an image'}
        </span>
        <span className="text-sm text-comelec-olive">
          {uploaded && fileName ? fileName : 'or drag and drop it here'}
        </span>
        <span className="text-xs text-comelec-olive">JPG, PNG or WebP · Up to 5 MB</span>
      </button>

      <p id={hintId} className="text-sm leading-relaxed text-comelec-olive">
        Make sure your name and current enrollment are readable.
      </p>
      <details className="text-sm leading-relaxed text-comelec-olive">
        <summary className="w-fit cursor-pointer font-medium text-comelec-forest underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-comelec-forest">
          Where do I find my Student Profile?
        </summary>
        <p className="mt-2">
          In ISMIS, click your avatar in the top right, then My Profile. Upload a screenshot that
          shows your name, student ID, Year Level and current term.
        </p>
      </details>

      {isUploading && (
        <output className="block text-sm text-comelec-olive">Uploading Student Profile...</output>
      )}
      {error && (
        <p role="alert" className="text-sm text-review-error">
          {error}
        </p>
      )}
      {uploaded && (
        <output className="block text-sm font-medium text-comelec-forest">
          Student Profile uploaded.
        </output>
      )}
    </div>
  )
}
