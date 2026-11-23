import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { ElectionNavigation } from '@/components/election/election-navigation'
import { electionContent, electionPageSpacing } from '@/components/election/election-styles'
import { ElectionFooter } from '@/components/landing/election-footer'
import type { ResultsOutput } from '@/server/trpc/api/v1/results/schema'
import { ResultsTally } from './results-tally'

function ReleasedResults({ results, sample }: { results: ResultsOutput; sample: boolean }) {
  return (
    <main className={`${electionContent} flex-1 pb-12 pt-8 text-[#324e1f]`}>
      <header className="border-b border-[#b6c89f] pb-7">
        <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-[#647357]">
          SSC General Elections 2026
        </p>
        <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] italic leading-[0.95] tracking-[-0.045em]">
          Election results.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647357]">
          Published after voting closes and the commission completes its audit.
        </p>
        <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
          <p className="text-lg font-medium">
            {results.countedBallots.toLocaleString('en-US')} ballots counted
          </p>
          <p className="text-[0.62rem] uppercase tracking-[0.08em] text-[#647357]">
            {sample
              ? 'Sample data · released state'
              : results.releasedAt
                ? `Released ${results.releasedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
                : null}
          </p>
        </div>
      </header>

      <div className="py-7">
        <ResultsTally results={results} />
      </div>

      <p className="mt-7 text-xs leading-5 text-[#647357]">
        Candidate order follows the ballot. Abstentions are shown separately from candidate
        selections. Only ballots from approved registrations are counted.
        {sample ? ' This page uses sample data for layout preview.' : ''}
      </p>
    </main>
  )
}

function UnreleasedResults() {
  return (
    <main className={`${electionContent} flex-1 pb-16 pt-[clamp(4rem,11vh,7rem)] text-[#324e1f]`}>
      <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-[#647357]">
        SSC General Elections 2026
      </p>
      <h1 className="max-w-[38rem] font-display text-[clamp(2.75rem,5vw,4rem)] italic leading-[0.95] tracking-[-0.045em]">
        Results are not
        <br />
        released yet.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#647357]">
        The commission will publish the results after voting closes and the audit is complete.
      </p>
      <div className="mt-7 max-w-[49rem] border border-[#b6c89f] px-5 py-5">
        <p className="text-sm font-semibold">Results are released by the commission</p>
        <p className="mt-2 text-xs leading-5 text-[#647357]">
          Candidate vote counts stay unavailable until the results are published.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Link
          href="/#turnout"
          className="inline-flex min-h-11 items-center gap-2 bg-[#324e1f] px-7 py-3 text-sm font-semibold text-[#faf3e0] hover:bg-[#253b16] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#324e1f]"
        >
          View total votes
          <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-semibold hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#324e1f]"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}

export function ElectionResultsPage({
  results,
  sample = false,
}: {
  /** Released Results, or null while they are still private. */
  results: ResultsOutput | null
  sample?: boolean
}) {
  return (
    <div
      className={`${electionPageSpacing} flex min-h-svh flex-col bg-[#faf3e0] text-comelec-forest [font-family:var(--font-inter),Arial,sans-serif] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#324e1f]`}
    >
      <ElectionNavigation activeSection="turnout" />
      {results ? <ReleasedResults results={results} sample={sample} /> : <UnreleasedResults />}
      <ElectionFooter />
    </div>
  )
}
