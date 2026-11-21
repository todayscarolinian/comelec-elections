import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { candidateHref, type DirectoryCandidate } from '@/lib/candidates'

export function CandidateParty({ party }: { party?: string }) {
  return (
    <span
      data-party={party}
      className="inline-flex w-fit items-center border border-comelec-forest/35 px-2 py-0.5 text-[0.625rem] leading-4 tracking-[0.04em] uppercase data-[party=STAND]:border-[#b39139] data-[party=Tingog]:border-[#cf7394] data-[party=SPP]:border-[#829e70]"
    >
      {party ?? 'Independent'}
    </span>
  )
}

export function CandidateCard({
  candidate,
  query = '',
}: {
  candidate: DirectoryCandidate
  query?: string
}) {
  const href = `${candidateHref(candidate.id)}${query}`
  return (
    <li className="group min-w-0">
      <Link
        href={href}
        aria-label={`View profile for ${candidate.name}`}
        className="block overflow-hidden bg-comelec-sage/20"
      >
        <Image
          src={candidate.photo}
          alt={candidate.name}
          width={400}
          height={400}
          sizes="(max-width: 359px) 90vw, (max-width: 767px) 44vw, (max-width: 1440px) 22vw, 304px"
          className="aspect-square h-auto w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.025]"
        />
      </Link>
      <h3 className="mt-2 font-editorial text-[clamp(1.125rem,1.6vw,1.4rem)] leading-tight wrap-anywhere">
        <Link href={href} className="hover:underline hover:underline-offset-4">
          {candidate.name}
        </Link>
      </h3>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <CandidateParty party={candidate.party} />
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium hover:underline hover:underline-offset-4"
        >
          View profile <ArrowUpRight aria-hidden="true" className="size-3.5" />
          <span className="sr-only">for {candidate.name}</span>
        </Link>
      </div>
    </li>
  )
}
