import { sectionAnchor } from './landing-styles'
import { Fraunces, Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { ElectionNavigation } from '@/components/election/election-navigation'
import { CandidateGallery } from './candidate-gallery'
import { ElectionCalendar } from './election-calendar'
import { ElectionFooter } from './election-footer'
import { ElectionHero } from './election-hero'
import { VoterTurnout } from './voter-turnout'
import { VotingGuide } from './voting-guide'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: 'italic',
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--landing-fraunces',
})
const inter = Inter({ subsets: ['latin'], variable: '--landing-body' })
const antinomiaDisplay = localFont({
  src: [
    {
      path: '../../../public/fonts/antimonia/Antinomia-Display-Italic-TRIAL.ttf',
      style: 'italic',
      weight: '400',
    },
    {
      path: '../../../public/fonts/antimonia/Antinomia-Display-Bold-Italic-TRIAL.ttf',
      style: 'italic',
      weight: '700',
    },
  ],
  variable: '--landing-display',
})
const antinomiaText = localFont({
  src: '../../../public/fonts/antimonia/Antinomia-Text-Regular-TRIAL.ttf',
  variable: '--landing-text',
  preload: false,
})

export function LandingPage() {
  return (
    <div
      id="home"
      className={`[--landing-green:#324e1f] [--landing-cream:#faf3e0] [--landing-muted:#4f6041] [--landing-nav-gutter:clamp(1rem,3.34vw,3rem)] [--landing-nav-top:clamp(0.625rem,1.35vw,1.25rem)] [--landing-section-gutter:var(--landing-nav-gutter)] min-[52rem]:[--landing-section-gutter:4rem] [--landing-header-space:calc(var(--landing-nav-top)+4.625rem)] max-[38rem]:[--landing-header-space:calc(var(--landing-nav-top)+6.375rem)] bg-(--landing-cream) text-(--landing-green) [font-family:var(--landing-body),Arial,sans-serif] [&_:is(a,button,summary):focus-visible]:outline-2 [&_:is(a,button,summary):focus-visible]:outline-offset-4 ${fraunces.variable} ${inter.variable} ${antinomiaDisplay.variable} ${antinomiaText.variable}`}
    >
      <a
        className="absolute left-4 top-4 z-30 -translate-y-[calc(100%+1rem)] bg-(--landing-cream) px-4 py-3 focus:translate-y-0"
        href="#election-content"
      >
        Skip to content
      </a>
      <ElectionNavigation isLanding />
      <main id="election-content" className={sectionAnchor} tabIndex={-1}>
        <div className="isolate">
          <ElectionHero />
          <CandidateGallery />
        </div>
        <ElectionCalendar />
        <VotingGuide />
        <VoterTurnout />
      </main>
      <ElectionFooter />
    </div>
  )
}
