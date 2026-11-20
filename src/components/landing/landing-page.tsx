import { Fraunces, Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { ElectionHero } from './election-hero'
import './landing.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: 'italic',
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

export function LandingPage() {
  return (
    <div
      id="home"
      className={`election-landing ${fraunces.variable} ${inter.variable} ${antinomiaDisplay.variable}`}
    >
      <a className="landing-skip-link" href="#election-content">
        Skip to content
      </a>
      <main id="election-content" tabIndex={-1}>
        <ElectionHero />
      </main>
    </div>
  )
}
