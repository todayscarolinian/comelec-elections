import { UserRound } from 'lucide-react'
import Image from 'next/image'

export function CandidatePortrait({
  candidate,
  sizes,
  className = '',
  plainPlaceholder = false,
}: {
  candidate: { photo?: string }
  sizes: string
  className?: string
  plainPlaceholder?: boolean
}) {
  return (
    <span
      className={`relative grid aspect-square w-full place-items-center overflow-hidden bg-comelec-sage/25 ${className}`}
    >
      {candidate.photo ? (
        <Image src={candidate.photo} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className={
            plainPlaceholder
              ? 'size-7 text-comelec-olive/60'
              : 'grid aspect-square w-1/3 max-w-24 min-w-[min(3rem,50%)] place-items-center rounded-full border border-comelec-olive/25 bg-comelec-sage-soft text-comelec-olive'
          }
        >
          <UserRound className={plainPlaceholder ? 'size-full' : 'size-1/2'} strokeWidth={1.25} />
        </span>
      )}
    </span>
  )
}
