import Link from 'next/link'
import { ElectionPageShell, contentGutters } from '@/components/election/election-page-shell'
import { registrationHeading } from '@/components/registration/registration-styles'
import type { LegalBlock, LegalDocument } from '@/content/legal/types'

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatLegalDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`))
}

function blockKey(block: LegalBlock): string {
  return typeof block === 'string' ? block : block.items.join('|')
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') return <p>{block}</p>
  return (
    <ul className="list-disc space-y-2 ps-5 marker:text-[#7c9264]">
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function LegalPage({ content }: { content: LegalDocument }) {
  return (
    <ElectionPageShell contentId="legal-content" skipLabel="Skip to content">
      <main
        id="legal-content"
        tabIndex={-1}
        className={`${contentGutters} flex-1 scroll-mt-28 py-[clamp(2rem,6svh,4.5rem)]`}
      >
        <article className="mx-auto max-w-[70ch] text-base leading-relaxed">
          {content.status === 'draft' && (
            <p
              role="note"
              className="mb-8 border border-[#c9a54a] bg-[#f6e7b8] px-4 py-3 text-sm text-[#4a3a0e]"
            >
              <strong className="font-semibold">Draft, pending commission review.</strong> This
              wording may change before it is approved.
            </p>
          )}

          <header className="space-y-4 border-b border-[#b6c89f] pb-8">
            <p className="text-xs font-medium uppercase">SSC COMELEC</p>
            <h1 className={`${registrationHeading} text-[clamp(2.5rem,6vw,4.5rem)]`}>
              {content.title}
            </h1>
            <p className="text-sm text-[#56654a]">
              Last updated{' '}
              <time dateTime={content.lastUpdated}>{formatLegalDate(content.lastUpdated)}</time>
              {' · '}Version {content.version}
            </p>
            <p className="text-lg">{content.summary}</p>
          </header>

          <nav aria-labelledby="legal-contents" className="border-b border-[#b6c89f] py-8">
            <h2 id="legal-contents" className="text-sm font-medium uppercase">
              On this page
            </h2>
            <ol className="mt-3 list-decimal space-y-1 ps-5 text-sm marker:text-[#7c9264]">
              {content.sections.map(({ id, heading }) => (
                <li key={id}>
                  <a href={`#${id}`} className="underline-offset-4 hover:underline">
                    {heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {content.sections.map(({ id, heading, body }) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-heading`}
              className="scroll-mt-28 space-y-4 border-b border-[#b6c89f] py-8 last:border-b-0"
            >
              <h2
                id={`${id}-heading`}
                className="text-[clamp(1.5rem,2.5vw,2rem)] leading-tight [font-family:var(--registration-text),Georgia,serif]"
              >
                {heading}
              </h2>
              {body.map((block) => (
                <Block key={blockKey(block)} block={block} />
              ))}
            </section>
          ))}

          <p className="mt-4 text-sm text-[#56654a]">
            See also:{' '}
            <Link
              href={content.related.href}
              className="font-medium text-[#324e1f] underline underline-offset-4"
            >
              {content.related.label}
            </Link>
          </p>
        </article>
      </main>
    </ElectionPageShell>
  )
}
