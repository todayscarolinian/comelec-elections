'use client'

import { UserRound } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import type { CandidateProfileContent } from '@/lib/candidate-profiles'

export function CandidatePortrait({
  candidate,
  sizes,
  className = '',
}: {
  candidate: CandidateProfileContent
  sizes: string
  className?: string
}) {
  return (
    <div
      className={`relative grid aspect-square w-full place-items-center overflow-hidden bg-comelec-sage/25 ${className}`}
    >
      <PortraitImage key={candidate.photo} src={candidate.photo} sizes={sizes} />
    </div>
  )
}

function PortraitImage({ src, sizes }: { src?: string; sizes: string }) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="grid aspect-square w-1/3 max-w-24 min-w-12 place-items-center rounded-full border border-comelec-olive/25 bg-comelec-sage-soft text-comelec-olive"
    >
      <UserRound className="size-1/2" strokeWidth={1.25} />
    </div>
  )
}
