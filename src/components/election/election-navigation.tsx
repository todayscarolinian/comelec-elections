import Image from 'next/image'
import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'

const sections = [
  { section: 'home', label: 'Home' },
  { section: 'candidates', label: 'Candidates' },
  { section: 'voting', label: 'Ballot' },
  { section: 'turnout', label: 'Results' },
] as const

type Section = (typeof sections)[number]['section'] | 'calendar'
type ElectionLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  isLanding: boolean
  section: Section
}

function ElectionLink({ isLanding, section, children, ...props }: ElectionLinkProps) {
  const hash = `#${section}`
  if (isLanding) {
    return (
      <a href={hash} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link href={section === 'home' ? '/' : `/${hash}`} {...props}>
      {children}
    </Link>
  )
}

export function ElectionNavigation({ isLanding = false }: { isLanding?: boolean }) {
  return (
    <header className={`sticky top-0 z-20 ${isLanding ? 'h-0' : ''}`}>
      <div className="pointer-events-none w-full px-[clamp(0.5rem,1.1vw,1rem)] pt-[clamp(0.625rem,1.35vw,1.25rem)]">
        <nav
          className="pointer-events-auto grid min-h-[4.625rem] grid-cols-[1fr_auto_1fr] items-center rounded-full border border-[#324e1f]/35 bg-[#e5efda]/44 px-[clamp(0.75rem,1.5vw,1.375rem)] py-3 text-[#17290e] shadow-[inset_0_1px_0_rgb(255_255_255/18%)] backdrop-blur-[16px] backdrop-saturate-125 max-[38rem]:grid-cols-[auto_1fr] max-[38rem]:gap-x-3 max-[38rem]:rounded-[1.25rem] max-[38rem]:py-[0.35rem] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:font-medium [&_a:hover]:underline [&_a:hover]:underline-offset-4"
          aria-label="Main navigation"
        >
          <ElectionLink
            isLanding={isLanding}
            section="home"
            className="justify-self-start"
            aria-label="SSC COMELEC home"
          >
            <Image src="/landing/mark.webp" alt="" width={33} height={33} />
          </ElectionLink>
          <ul className="flex flex-wrap gap-x-[clamp(1rem,4.4vw,4rem)] gap-y-1 max-[38rem]:col-span-2 max-[38rem]:row-start-2 max-[38rem]:justify-between max-[38rem]:gap-x-2 max-[38rem]:text-sm">
            {sections.map(({ section, label }) => (
              <li key={section}>
                <ElectionLink
                  isLanding={isLanding}
                  section={section}
                  aria-current={isLanding && section === 'home' ? 'page' : undefined}
                >
                  {label}
                </ElectionLink>
              </li>
            ))}
          </ul>
          <ElectionLink
            isLanding={isLanding}
            section="calendar"
            className="-me-3 min-w-11 justify-center justify-self-end max-[38rem]:col-start-2 max-[38rem]:row-start-1"
            aria-label="Election calendar"
          >
            <Image src="/landing/bell.svg" alt="" width={20} height={20} />
          </ElectionLink>
        </nav>
      </div>
    </header>
  )
}
