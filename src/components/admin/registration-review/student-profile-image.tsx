'use client'

import Image from 'next/image'
import { useState } from 'react'

export function StudentProfileImage({
  url,
  name,
  onRefresh,
}: {
  url: string | null
  name: string
  onRefresh: () => void
}) {
  const [failed, setFailed] = useState(false)
  if (!url || failed)
    return (
      <div className="grid min-h-[220px] place-content-center gap-3 border border-review-line p-6 text-center">
        <p>Student profile unavailable. Refresh the document to try again.</p>
        <button
          className="min-h-11 underline"
          onClick={() => {
            setFailed(false)
            onRefresh()
          }}
        >
          Refresh document
        </button>
      </div>
    )
  return (
    <Image
      src={url}
      alt={`Student profile for ${name}`}
      unoptimized
      width={1200}
      height={1600}
      className="h-auto max-h-[70dvh] w-full object-contain"
      onError={() => setFailed(true)}
    />
  )
}
