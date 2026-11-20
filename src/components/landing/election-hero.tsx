import { action } from './landing-styles'
import Image from 'next/image'
import Link from 'next/link'
import { ElectionStatus } from './election-status'

export function ElectionHero() {
  return (
    <section
      className="flex min-h-svh flex-col bg-[#d8e9bd] bg-[url('/landing/hero.webp')] bg-position-[73.73%_90.78%] bg-size-[137.88%_109%]"
      aria-labelledby="election-title"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-(--landing-nav-gutter) pt-(--landing-header-space)">
        <div className="flex flex-1 flex-col justify-between gap-8 pt-[clamp(2rem,6svh,5.5rem)] pb-[clamp(1rem,3.4svh,2.25rem)] [@media(max-height:50rem)]:gap-4 [@media(max-height:50rem)]:pt-8">
          <div className="grid w-full max-w-sm justify-items-start gap-4 self-end me-[clamp(0rem,6.2vw,5.5625rem)] max-[38rem]:me-0 max-[38rem]:self-start max-[38rem]:bg-(--landing-cream)/68 max-[38rem]:p-3.5">
            <ElectionStatus />
            <p>
              Cast one Ballot online on November 20. Anyone can follow Turnout. The Commission
              releases the Results after the audit.
            </p>
            <Link
              className={`${action} bg-(--landing-green) text-(--landing-cream) hover:bg-[#233b18] focus-visible:outline-(--landing-green)`}
              href="/register"
            >
              Check registration <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="relative isolate [--hero-title-limit:26.5svh] [container-type:inline-size] min-[52rem]:mx-[calc(4rem-var(--landing-nav-gutter))] min-[75rem]:mx-[calc(8rem-var(--landing-nav-gutter))] [@media(max-height:50rem)]:[--hero-title-limit:25svh]">
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
              className="grid grid-cols-[auto_1fr] items-end text-[min(16.5cqi,var(--hero-title-limit))] leading-[0.89] font-normal tracking-[-0.015em] text-(--landing-cream) uppercase italic [font-family:var(--landing-fraunces),Georgia,serif] [font-variation-settings:'opsz'_144,'SOFT'_0,'WONK'_1] min-[52rem]:text-[min(20.2cqi,15.625rem,var(--hero-title-limit))] min-[52rem]:leading-[0.96]"
            >
              <span className="col-start-1 row-start-1 min-[52rem]:leading-[0.8]">SSC</span>{' '}
              <span className="col-span-2 row-start-2">Elections</span>{' '}
              <span className="col-start-2 row-start-1 justify-self-end pe-[0.06em] text-[1.36em] font-bold text-transparent [font-family:var(--landing-display),Georgia,serif] [font-variation-settings:normal] [-webkit-text-stroke:clamp(1px,0.14vw,2px)_var(--landing-cream)] min-[52rem]:leading-[0.8] forced-colors:text-[CanvasText] forced-colors:[-webkit-text-stroke:0]">
                ‘26
              </span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}
