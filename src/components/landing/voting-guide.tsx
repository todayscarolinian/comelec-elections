import { displayHeading, sectionAnchor, sectionInner } from './landing-styles'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function VotingGuide() {
  return (
    <section
      id="voting"
      className={`${sectionAnchor} flex min-h-[57svh] flex-col justify-center py-[clamp(3.75rem,7.5svh,5.75rem)]`}
      aria-labelledby="guide-heading"
    >
      <div className={`${sectionInner} flex flex-col gap-[clamp(2.5rem,5.5svh,4rem)]`}>
        <div className="flex items-center justify-between gap-5 max-[38rem]:flex-col max-[38rem]:items-start">
          <h2
            id="guide-heading"
            className={`${displayHeading} text-[clamp(2.75rem,5.7vw,5.25rem)] leading-tight`}
          >
            Before you vote.
          </h2>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 py-2.5 text-sm font-semibold hover:underline hover:underline-offset-4"
          >
            Check registration status{' '}
            <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        </div>
        <ol className="grid gap-x-[clamp(1.25rem,3vw,3rem)] gap-y-9 border-y border-(--landing-green)/35 py-[clamp(2rem,4.25svh,3rem)] [counter-reset:steps] min-[38.01rem]:grid-cols-3 [&>li]:relative [&>li]:ps-8 [&>li]:[counter-increment:steps] [&>li]:before:absolute [&>li]:before:top-1 [&>li]:before:start-0 [&>li]:before:text-xs [&>li]:before:content-[counter(steps,decimal-leading-zero)] [&_h3]:text-[clamp(1.4rem,2vw,2rem)] [&_h3]:leading-tight [&_h3]:[font-family:var(--landing-text),Georgia,serif] [&_p]:mt-3.5 [&_p]:max-w-[44ch] [&_p]:leading-relaxed [&_p]:text-(--landing-muted)">
          <li>
            <h3>Register</h3>
            <p>
              Sign in with your USC email account through Google, upload your Student Profile, and
              select your Year Level.
            </p>
          </li>
          <li>
            <h3>Check your status</h3>
            <p>
              If your registration is pending or rejected, you can cast a Held Ballot while voting
              is open. It counts once your registration is approved.
            </p>
          </li>
          <li>
            <h3>Review &amp; vote</h3>
            <p>
              Review your choices before submitting. Your ballot is final. Online ballot submission
              is currently unavailable here.
            </p>
          </li>
        </ol>
      </div>
    </section>
  )
}
