import { action } from './landing-styles'
import Image from 'next/image'
import Link from 'next/link'
import { ElectionStatus } from './election-status'

export function ElectionHero() {
  return (
    <section
      className="bg-[#d8e9bd] bg-[url('/landing/hero.webp')] bg-position-[73.73%_90.78%] bg-size-[137.88%_109%]"
      aria-labelledby="election-title"
    >
      <div className="mx-auto max-w-[90rem] px-(--landing-nav-gutter) pt-(--landing-header-space)">
        <div className="flex min-h-[clamp(30rem,74vw,41rem)] flex-col justify-between pt-[clamp(3rem,6vw,5.5rem)] pb-[clamp(1.5rem,2.5vw,2.25rem)] min-[52.01rem]:min-h-[clamp(40rem,62.64vw,56.375rem)]">
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
          <div className="relative isolate">
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
              className="grid grid-cols-[auto_1fr] items-end text-[min(15vw,14.5rem)] leading-[0.89] font-normal tracking-[-0.015em] uppercase italic [font-family:var(--landing-fraunces),Georgia,serif] [font-variation-settings:'opsz'_144,'SOFT'_0,'WONK'_1] min-[52.01rem]:text-[min(17.36vw,15.625rem)] min-[52.01rem]:leading-[0.96] text-transparent [-webkit-text-stroke:clamp(1px,0.14vw,2px)_var(--landing-cream)] forced-colors:text-[CanvasText] forced-colors:[-webkit-text-stroke:0]"
            >
              <span className="col-start-1 row-start-1 min-[52.01rem]:leading-[0.8]">SSC</span>{' '}
              <span className="col-span-2 row-start-2">Elections</span>{' '}
              <span className="col-start-2 row-start-1 justify-self-end pe-[0.06em] text-[1.36em] font-bold [font-family:var(--landing-display),Georgia,serif] [font-variation-settings:normal] min-[52.01rem]:me-[5.6%] min-[52.01rem]:leading-[0.8]">
                ‘26
              </span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}
