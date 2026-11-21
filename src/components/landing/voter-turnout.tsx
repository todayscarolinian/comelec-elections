import {
  action,
  displayHeading,
  sectionAnchor,
  sectionInner,
  sectionPadding,
} from './landing-styles'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function VoterTurnout() {
  return (
    <section
      id="turnout"
      className={`${sectionAnchor} ${sectionPadding} flex min-h-svh flex-col bg-(--landing-green) text-(--landing-cream)`}
      aria-labelledby="turnout-heading"
    >
      <div className={`${sectionInner} flex flex-1 flex-col`}>
        <h2
          id="turnout-heading"
          className={`${displayHeading} text-[clamp(2.75rem,5.7vw,5.25rem)] leading-tight`}
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
            Check registration <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  )
}
