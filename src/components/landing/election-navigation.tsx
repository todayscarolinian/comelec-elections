import Image from 'next/image'

export function ElectionNavigation() {
  return (
    <header className="sticky top-0 z-20 h-0">
      <div className="pointer-events-none w-full px-[clamp(0.5rem,1.1vw,1rem)] pt-(--landing-nav-top)">
        <nav
          className="pointer-events-auto grid min-h-[4.625rem] grid-cols-[1fr_auto_1fr] items-center rounded-full border border-(--landing-green)/35 bg-[#e5efda]/44 px-[clamp(0.75rem,1.5vw,1.375rem)] py-3 text-[#17290e] shadow-[inset_0_1px_0_rgb(255_255_255/18%)] backdrop-blur-[16px] backdrop-saturate-125 max-[38rem]:grid-cols-[auto_1fr] max-[38rem]:gap-x-3 max-[38rem]:rounded-[1.25rem] max-[38rem]:py-[0.35rem] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:font-medium [&_a:hover]:underline [&_a:hover]:underline-offset-4"
          aria-label="Main navigation"
        >
          <a className="justify-self-start" href="#home" aria-label="SSC COMELEC home">
            <Image src="/landing/mark.webp" alt="" width={33} height={33} />
          </a>
          <ul className="flex flex-wrap gap-x-[clamp(1rem,4.4vw,4rem)] gap-y-1 max-[38rem]:col-span-2 max-[38rem]:row-start-2 max-[38rem]:justify-between max-[38rem]:gap-x-2 max-[38rem]:text-sm">
            <li>
              <a href="#home" aria-current="page">
                Home
              </a>
            </li>
            <li>
              <a href="#candidates">Candidates</a>
            </li>
            <li>
              <a href="#voting">Ballot</a>
            </li>
            <li>
              <a href="#turnout">Results</a>
            </li>
          </ul>
          <a
            className="-me-3 min-w-11 justify-center justify-self-end max-[38rem]:col-start-2 max-[38rem]:row-start-1"
            href="#calendar"
            aria-label="Election calendar"
          >
            <Image src="/landing/bell.svg" alt="" width={20} height={20} />
          </a>
        </nav>
      </div>
    </header>
  )
}
