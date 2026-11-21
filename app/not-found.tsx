import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ElectionNavigation } from '@/components/election/election-navigation'
import { electionPageSpacing } from '@/components/election/election-styles'
import { fraunces } from '@/components/election/election-fonts'
import { ElectionFooter } from '@/components/landing/election-footer'
import { action, displayHeading } from '@/components/landing/landing-styles'
import { HeroShader } from '@/components/landing/hero-shader'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you requested could not be found.',
}

export default function NotFound() {
  return (
    <div
      className={`${electionPageSpacing} ${fraunces.variable} flex min-h-svh flex-col bg-comelec-cream text-comelec-forest [--landing-display:var(--font-antinomia-display)] [--landing-text:var(--font-antinomia-text)] [--landing-nav-gutter:var(--election-page-gutter)] [--landing-nav-top:clamp(0.625rem,1.35vw,1.25rem)] [--landing-section-gutter:var(--election-content-gutter)] [--landing-header-space:calc(var(--landing-nav-top)+4.625rem)] max-[38rem]:[--landing-header-space:calc(var(--landing-nav-top)+6.375rem)] [font-family:var(--font-inter),Arial,sans-serif] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4`}
    >
      <ElectionNavigation isLanding />

      <main className="relative isolate flex min-h-[clamp(28rem,64svh,43rem)] flex-1 flex-col overflow-hidden bg-[#d8e9bd] bg-[url('/landing/hero.webp')] bg-position-[73.73%_90.78%] bg-size-[137.88%_109%] pt-[var(--landing-header-space)]">
        <HeroShader />

        <section
          className="relative z-10 grid flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-start gap-[clamp(1.5rem,4vw,4rem)] px-[clamp(1.25rem,4.5vw,4.5rem)] py-[clamp(3.5rem,8svh,4rem)] max-[52rem]:grid-cols-1 max-[52rem]:gap-0 max-[52rem]:py-8"
          aria-labelledby="not-found-title"
        >
          <div className="relative z-10 w-full max-w-[44rem]">
            <p className="mb-7 text-xs font-semibold tracking-[0.28em] text-comelec-forest uppercase">
              Error 404 · Page not found
            </p>
            <h1
              id="not-found-title"
              className={`${displayHeading} text-[clamp(3rem,6.6vw,5.25rem)] leading-[0.9]`}
            >
              Oops! We couldn&apos;t find that page.
            </h1>
            <p className="mt-8 max-w-[24rem] text-sm leading-6 text-comelec-forest max-[52rem]:max-w-[34rem] max-[38rem]:mt-5">
              The page you&apos;re looking for doesn&apos;t exist, was moved,
              <br className="max-[52rem]:hidden" /> or the election link has expired.
              Let&apos;s get you
              <br className="max-[52rem]:hidden" /> back to the vote.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className={`${action} !min-h-10 !px-4 gap-1 text-[13px] bg-comelec-forest text-comelec-cream hover:bg-comelec-forest-dark`}
              >
                Back to home
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="pointer-events-none relative min-h-[clamp(22rem,32vw,26rem)] w-full max-[52rem]:mt-7 max-[52rem]:min-h-[14rem]" aria-hidden="true">
            <span
              className="absolute left-[35%] top-[10%] flex -translate-x-1/2 scale-x-[1.05] items-center gap-[0.045em] whitespace-nowrap text-[clamp(12rem,29vw,22rem)] leading-[0.9] tracking-[-0.055em] text-comelec-forest [font-family:var(--landing-fraunces),Georgia,serif] [font-variation-settings:'opsz'_144,'SOFT'_0,'WONK'_1] max-[52rem]:left-1/2 max-[52rem]:top-0 max-[52rem]:scale-x-100 max-[52rem]:text-[clamp(6.5rem,18vw,9rem)]"
            >
              <span>4</span>
              <span className="comelec-outline-display inline-block font-light">0</span>
              <span>4</span>
            </span>
            <Image
              src="/landing/motif.webp"
              alt=""
              width={240}
              height={194}
              className="absolute bottom-[3%] left-[-74%] w-[44%] max-w-[15rem] rotate-[-12deg] scale-y-[1.08] max-[52rem]:bottom-0 max-[52rem]:left-[10%] max-[52rem]:w-[9rem] max-[52rem]:scale-y-100"
            />
            <Image
              src="/landing/motif-two.webp"
              alt=""
              width={240}
              height={194}
              className="absolute bottom-[-50%] left-[-54%] w-[56%] max-w-[18rem] rotate-[18deg] opacity-70 max-[52rem]:bottom-[-8%] max-[52rem]:left-[48%] max-[52rem]:w-[9rem]"
            />
          </div>
        </section>
      </main>

      <ElectionFooter />
    </div>
  )
}
