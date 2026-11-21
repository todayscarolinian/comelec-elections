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
  const [image, setImage] = useState({ src: url, failed: false })
  // Keep the displayed URL while it works. A loaded image doesn't need a new signature.
  if (url && url !== image.src && (!image.src || image.failed)) {
    setImage({ src: url, failed: false })
  }
  if (!image.src || image.failed)
    return (
      <div className="grid min-h-[220px] place-content-center gap-3 border border-review-line p-6 text-center">
        <p>Student profile unavailable. Refresh the document to try again.</p>
        <button className="min-h-11 underline" onClick={onRefresh}>
          Refresh document
        </button>
      </div>
    )
  return (
    <Image
      src={image.src}
      alt={`Student profile for ${name}`}
      unoptimized
      width={1200}
      height={1600}
      className="h-auto max-h-[70dvh] w-full object-contain"
      onError={() => setImage({ ...image, failed: true })}
    />
  )
}
