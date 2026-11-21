'use client'

import { useMutation } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getStudentProfileValidationError, STUDENT_PROFILE_MIME_TYPES } from '@/lib/student-profile'
import { useTRPC } from '@/lib/trpc/client'
import { StudentProfileTutorial } from './student-profile-tutorial'

type StudentProfileUploadProps = {
  onUploaded: (path: string) => void
  onUploadStart?: () => void
  disabled?: boolean
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-6 animate-spin text-[#324e1f]"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StudentProfileUpload({
  onUploaded,
  onUploadStart,
  disabled = false,
}: Readonly<StudentProfileUploadProps>) {
  const trpc = useTRPC()
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const createUpload = useMutation(trpc.registration.createStudentProfileUpload.mutationOptions())
  const uploading = useRef(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>()
  const [uploadedFileName, setUploadedFileName] = useState('')

  async function upload(file: File) {
    if (disabled || uploading.current) return
    onUploadStart?.()
    setUploadedFileName('')
    const validationError = getStudentProfileValidationError(file)

    if (validationError) {
      setError(validationError)
      return
    }

    setError(undefined)
    uploading.current = true
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

      setUploadedFileName(file.name)
      onUploaded(path)
      toast.success('Student Profile uploaded', { description: file.name })
    } catch {
      setError('Unable to upload the Student Profile. Please try again.')
    } finally {
      uploading.current = false
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        Student Profile
      </label>
      <div
        className="relative flex min-h-32 flex-col items-center justify-center gap-1.5 border border-dashed border-[#9fb58b] p-5 text-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:enabled]:hover:bg-[#eef0d9]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const file = event.dataTransfer.files[0]
          if (file) void upload(file)
        }}
      >
        <input
          id={inputId}
          type="file"
          aria-describedby={hintId}
          accept={STUDENT_PROFILE_MIME_TYPES.join(',')}
          disabled={disabled || isUploading}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:pointer-events-none"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (file) void upload(file)
          }}
        />

        {isUploading ? (
          <output className="flex flex-col items-center gap-2 text-sm font-medium text-[#324e1f]">
            <Spinner />
            Uploading Student Profile...
          </output>
        ) : (
          <>
            <p className="max-w-full font-medium wrap-anywhere">
              {uploadedFileName || (
                <span className="underline underline-offset-4">Choose an image</span>
              )}
            </p>
            <p className="text-sm text-[#56654a]">
              {uploadedFileName ? 'Choose another image to replace it' : 'or drag and drop it here'}
            </p>
            <p className="text-xs text-[#56654a]">JPEG, PNG or WebP · Up to 5 MB</p>
          </>
        )}
      </div>
      <p id={hintId} className="text-sm leading-relaxed text-[#56654a]">
        Make sure your name and current enrollment are readable.
      </p>
      <StudentProfileTutorial />

      {error && (
        <p role="alert" className="text-sm text-[#862f29]">
          {error}
        </p>
      )}
    </div>
  )
}
