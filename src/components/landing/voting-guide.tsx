import { displayHeading, sectionAnchor, sectionInner } from './landing-styles'
import Link from 'next/link'

export function VotingGuide() {
  return (
    <section
      id="voting"
      className={`${sectionAnchor} py-[clamp(2.75rem,4.45vw,4rem)]`}
      aria-labelledby="guide-heading"
    >
      <div className={sectionInner}>
        <div className="flex items-center justify-between gap-5 max-[38rem]:flex-col max-[38rem]:items-start">
          <h2
            id="guide-heading"
            className={`${displayHeading} text-[clamp(2.4rem,5vw,4.5rem)] leading-tight`}
          >
            Before you vote.
          </h2>
          <Link
            href="/register"
            className="py-2.5 text-sm font-semibold hover:underline hover:underline-offset-4"
          >
            Check registration status <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <ol className="mt-8 grid gap-[clamp(1.25rem,3vw,3rem)] border-y border-(--landing-green)/35 py-6 [counter-reset:steps] min-[38.01rem]:grid-cols-3 [&>li]:relative [&>li]:ps-8 [&>li]:[counter-increment:steps] [&>li]:before:absolute [&>li]:before:top-1 [&>li]:before:start-0 [&>li]:before:text-xs [&>li]:before:content-[counter(steps,decimal-leading-zero)] [&_h3]:text-[clamp(1.4rem,2vw,2rem)] [&_h3]:leading-tight [&_h3]:[font-family:var(--landing-text),Georgia,serif] [&_p]:mt-2.5 [&_p]:text-(--landing-muted)">
          <li>
            <h3>Register</h3>
            <p>
              Sign in with your organization Google account, upload your Student Profile, and select
              your Year Level.
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
