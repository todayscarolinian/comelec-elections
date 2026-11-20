import { action, displayHeading, sectionAnchor, sectionInner } from './landing-styles'
import Link from 'next/link'

export function VoterTurnout() {
  return (
    <section
      id="turnout"
      className={`${sectionAnchor} flex min-h-svh flex-col bg-(--landing-green) py-[clamp(2.75rem,4.45vw,4rem)] text-(--landing-cream)`}
      aria-labelledby="turnout-heading"
    >
      <div className={`${sectionInner} flex w-full flex-1 flex-col`}>
        <h2
          id="turnout-heading"
          className={`${displayHeading} text-[clamp(2.4rem,5vw,4.5rem)] leading-tight`}
        >
          Voter turnout
        </h2>
        <div className="grid flex-1 content-center justify-items-center py-8 text-center">
          <span
            className="text-[clamp(6rem,min(20vw,32svh),18rem)] leading-none italic [font-family:var(--landing-fraunces),Georgia,serif]"
            aria-hidden="true"
          >
            —
          </span>
          <p className="text-[0.8rem] tracking-[0.12em] uppercase">Live turnout is unavailable.</p>
        </div>
        <div className="flex items-center justify-between gap-5 max-[38rem]:flex-col max-[38rem]:items-start">
          <p>Results are published after the Commission completes its audit.</p>
          <Link
            className={`${action} bg-(--landing-cream) text-(--landing-green) hover:bg-[#e7ebcd] focus-visible:outline-(--landing-cream)`}
            href="/register"
          >
            Check registration <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
