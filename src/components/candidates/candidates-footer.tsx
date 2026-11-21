import Image from 'next/image'
import Link from 'next/link'

export function CandidatesFooter() {
  return (
    <footer className="mx-auto mt-auto w-full max-w-[1440px] px-[clamp(1rem,4.5vw,4rem)] pb-5 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t border-comelec-sage py-4">
        <Link href="/" aria-label="SSC COMELEC home" className="flex items-center gap-3">
          <Image
            src="/landing/mark.webp"
            alt=""
            width={56}
            height={56}
            className="size-12 object-contain sm:size-14"
          />
          <span>
            <span className="block font-editorial text-2xl leading-tight sm:text-3xl">
              SSC COMELEC
            </span>
            <span className="mt-1 block text-xs text-comelec-olive">
              Student council elections · 2026
            </span>
          </span>
        </Link>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-1 text-sm">
          <Link href="/candidates" className="inline-flex min-h-11 items-center hover:underline">
            Candidates
          </Link>
          <Link href="/#voting" className="inline-flex min-h-11 items-center hover:underline">
            Ballot
          </Link>
          <a
            href="mailto:comelec@usc.edu.ph"
            className="inline-flex min-h-11 items-center hover:underline"
          >
            Contact the Commission
          </a>
        </nav>
      </div>
    </footer>
  )
}
