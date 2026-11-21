'use client'

import { useMutation } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
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
        <p className="max-w-full font-medium wrap-anywhere">
          {uploadedFileName || (
            <span className="underline underline-offset-4">Choose an image</span>
          )}
        </p>
        <p className="text-sm text-[#56654a]">
          {uploadedFileName ? 'Choose another image to replace it' : 'or drag and drop it here'}
        </p>
        <p className="text-xs text-[#56654a]">JPEG, PNG or WebP · Up to 5 MB</p>
      </div>
      <p id={hintId} className="text-sm leading-relaxed text-[#56654a]">
        Make sure your name and current enrollment are readable.
      </p>
      <details className="text-sm leading-relaxed text-[#56654a]">
        <summary className="w-fit cursor-pointer font-medium text-[#324e1f] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
          Where do I find my Student Profile?
        </summary>
        <p className="mt-2">
          In ISMIS, click your avatar in the top right, then My Profile. Upload a screenshot that
          shows your name, student ID, Year Level and current term.
        </p>
      </details>

      {isUploading && (
        <output className="block text-sm text-[#56654a]">Uploading Student Profile...</output>
      )}
      {error && (
        <p role="alert" className="text-sm text-[#862f29]">
          {error}
        </p>
      )}
      {uploadedFileName && (
        <output className="block text-sm font-medium text-[#324e1f]">
          Student Profile uploaded.
        </output>
      )}
    </div>
  )
}
