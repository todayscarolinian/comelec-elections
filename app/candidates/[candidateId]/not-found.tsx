import Link from 'next/link'

export default function CandidateNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-xs tracking-widest text-comelec-olive uppercase">SSC Elections</p>
      <h1 className="mt-4 font-display text-5xl italic">Candidate not found.</h1>
      <p className="mt-5 text-sm leading-relaxed text-comelec-olive">
        This profile is unavailable. Browse the directory to meet the currently listed candidates.
      </p>
      <Link
        href="/candidates"
        className="mt-8 inline-flex min-h-12 items-center border border-comelec-forest px-6 text-sm hover:bg-comelec-sage/25"
      >
        Back to candidates
      </Link>
    </div>
  )
}
