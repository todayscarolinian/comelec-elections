import { action } from './landing-styles'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ElectionStatus } from './election-status'
import { HeroShader } from './hero-shader'

export function ElectionHero() {
  return (
    <section
      className="relative top-0 isolate flex min-h-svh flex-col bg-[#d8e9bd] bg-[url('/landing/hero.webp')] bg-position-[73.73%_90.78%] bg-size-[137.88%_109%] motion-safe:[@media(min-height:36rem)]:sticky has-[:focus-visible]:relative"
      aria-labelledby="election-title"
    >
      <HeroShader />
      <div className="flex w-full flex-1 flex-col px-(--landing-nav-gutter) pt-(--landing-header-space)">
        <div className="flex flex-1 flex-col justify-between gap-6 pt-[clamp(2rem,6svh,5.5rem)] pb-[clamp(1rem,3.4svh,2.25rem)] [@media(max-height:50rem)]:gap-4 [@media(max-height:50rem)]:pt-8">
          <div className="relative z-10 grid w-full max-w-sm justify-items-start gap-4 self-end me-[clamp(0rem,6.2vw,5.5625rem)] max-[38rem]:me-0 max-[38rem]:self-start max-[38rem]:bg-(--landing-cream)/68 max-[38rem]:p-3.5">
            <ElectionStatus />
            <p>
              Cast one Ballot online on November 20. Anyone can follow Turnout. The Commission
              releases the Results after the audit.
            </p>
            <Link
              className={`${action} bg-(--landing-green) text-(--landing-cream) hover:bg-[#233b18] focus-visible:outline-(--landing-green)`}
              href="/register"
            >
              Check registration <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          </div>
          <div className="relative isolate mx-[calc(var(--landing-section-gutter)-var(--landing-nav-gutter))] [--hero-title-limit:29svh] [container-type:inline-size] [@media(max-height:50rem)]:[--hero-title-limit:27svh]">
            <Image
              className="absolute left-[37%] top-[5%] -z-10 h-auto w-[13.2%] min-[52.01rem]:w-[15%]"
              src="/landing/motif.webp"
              alt=""
              width={240}
              height={194}
            />
            <Image
              className="absolute left-[28%] top-[-24%] -z-10 h-auto w-[13.2%] rotate-[-163deg] opacity-70 min-[52.01rem]:w-[15%]"
              src="/landing/motif-two.webp"
              alt=""
              width={240}
              height={194}
            />
            <h1
              id="election-title"
              className="grid grid-cols-[auto_1fr] items-end text-[min(20.2cqi,var(--hero-title-limit))] leading-[0.89] font-normal tracking-[-0.015em] text-(--landing-cream) uppercase italic [font-family:var(--landing-fraunces),Georgia,serif] [font-variation-settings:'opsz'_144,'SOFT'_0,'WONK'_1] min-[52rem]:leading-[0.96]"
            >
              <span className="col-start-1 row-start-1 w-fit origin-bottom-left scale-x-105 scale-y-112 tracking-[-0.04em] min-[52rem]:leading-[0.8]">
                SSC
              </span>{' '}
              {/* Offset the wider letters with tighter tracking to preserve the line width. */}
              <span className="col-span-2 row-start-2 w-fit origin-bottom-left scale-x-105 scale-y-112 tracking-[calc((var(--line-tracking)-0.027em)/1.05)] whitespace-nowrap [--line-tracking:clamp(-0.015em,calc((98cqi-4.89em)/9),0.07em)]">
                Elections
              </span>{' '}
              <span className="col-start-2 row-start-1 justify-self-end pe-[0.06em] text-[1.36em] font-bold text-transparent [font-family:var(--landing-display),Georgia,serif] [font-variation-settings:normal] [-webkit-text-stroke:clamp(1px,0.14vw,2px)_var(--landing-cream)] min-[52rem]:leading-[0.68] forced-colors:text-[CanvasText] forced-colors:[-webkit-text-stroke:0]">
                ‘26
              </span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}
