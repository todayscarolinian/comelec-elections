import type { Metadata } from 'next'
import { BallotPage } from '@/components/ballot/ballot-page'
import { ElectionNavigation } from '@/components/election/election-navigation'
import { ElectionFooter } from '@/components/landing/election-footer'

export const metadata: Metadata = {
  title: 'Ballot',
  description: 'Review the voting disclosure, make your selections, and cast your SSC ballot.',
}

export default function Page() {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-comelec-cream text-comelec-forest [--landing-muted:#647357] [--landing-section-gutter:clamp(1rem,4.45vw,4rem)] [--landing-text:var(--font-antinomia-text)] [&_:is(a,button,input):focus-visible]:outline-2 [&_:is(a,button,input):focus-visible]:outline-offset-4">
      <a
        href="#ballot-content"
        className="absolute start-4 top-4 z-30 -translate-y-[calc(100%+1rem)] bg-comelec-cream px-4 py-3 focus:translate-y-0"
      >
        Skip to ballot
      </a>
      <ElectionNavigation isBallot />
      <main
        id="ballot-content"
        tabIndex={-1}
        className="flex flex-1 flex-col px-(--landing-section-gutter)"
      >
        <BallotPage />
      </main>
      <ElectionFooter />
    </div>
  )
}
