import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { BallotEntry } from '@/components/ballot/ballot-entry'
import { ElectionNavigation } from '@/components/election/election-navigation'

const ballotCount = 2000

const positions = [
  {
    title: 'President',
    detail: 'Choose 1 per ballot',
    candidates: [
      { name: 'Andrea Villanueva', votes: 1120 },
      { name: 'Miguel Ramos', votes: 620 },
      { name: 'Kristine Uy', votes: 180 },
      { name: 'Abstain', votes: 80, abstention: true },
    ],
  },
  {
    title: 'Vice President',
    detail: 'Choose 1 per ballot',
    candidates: [
      { name: 'Paolo Lim', votes: 1040 },
      { name: 'Bea Navarro', votes: 860 },
      { name: 'Abstain', votes: 100, abstention: true },
    ],
  },
  {
    title: 'Councilors',
    detail: 'Up to 3 selections per ballot',
    candidates: [
      { name: 'Carla Tan', votes: 1200 },
      { name: 'Jerome Abella', votes: 1060 },
      { name: 'Nina Ocampo', votes: 980 },
      { name: 'Rafael Go', votes: 820 },
      { name: 'Sofia Reyes', votes: 760 },
      { name: 'Luis Bautista', votes: 500 },
      { name: 'Abstain', votes: 150, abstention: true },
    ],
  },
]

function ResultsFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-[82rem] items-center justify-between gap-6 border-t border-[#b6c89f] px-[clamp(1.25rem,4.5vw,4rem)] py-5 text-[#324e1f] max-[38rem]:flex-col max-[38rem]:items-start">
      <Link href="/" className="flex items-center gap-3" aria-label="SSC COMELEC home">
        <Image src="/landing/mark.webp" alt="" width={48} height={48} />
        <span>
          <span className="block font-editorial text-[clamp(1.4rem,2.4vw,2rem)] leading-tight">
            SSC COMELEC
          </span>
          <span className="block text-xs text-[#647357]">Student council elections · 2026</span>
        </span>
      </Link>
      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap gap-x-8 text-sm font-medium [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a:hover]:underline [&_a:hover]:underline-offset-4"
      >
        <Link href="/candidates">Candidates</Link>
        <BallotEntry />
      </nav>
    </footer>
  )
}

function CandidateResults({
  name,
  votes,
  abstention = false,
}: {
  name: string
  votes: number
  abstention?: boolean
}) {
  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className={abstention ? 'text-[#647357]' : ''}>{name}</span>
        <span className="shrink-0 tabular-nums">
          {votes.toLocaleString('en-US')} {abstention ? 'abstentions' : 'votes'}
        </span>
      </div>
      <progress
        className={`result-progress h-1.5 w-full ${abstention ? 'result-progress--abstention' : ''}`}
        aria-label={`${name} ${abstention ? 'abstentions' : 'votes'}`}
        value={votes}
        max={ballotCount}
      />
    </li>
  )
}

function ReleasedResults() {
  return (
    <>
      <main className="mx-auto w-full max-w-[82rem] flex-1 px-[clamp(1.25rem,4.5vw,4rem)] pb-12 pt-8 text-[#324e1f]">
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
              {ballotCount.toLocaleString('en-US')} ballots cast
            </p>
            <p className="text-[0.62rem] uppercase tracking-[0.08em] text-[#647357]">
              Sample data · released state
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-x-12 gap-y-8 border-b border-[#b6c89f] py-7 max-[42rem]:grid-cols-1">
          {positions.slice(0, 2).map((position) => (
            <section key={position.title} aria-labelledby={`position-${position.title}`}>
              <h2
                id={`position-${position.title}`}
                className="font-editorial text-2xl leading-tight"
              >
                {position.title}
              </h2>
              <p className="mb-4 mt-2 text-xs text-[#647357]">{position.detail}</p>
              <ul className="space-y-3">
                {position.candidates.map((candidate) => (
                  <CandidateResults key={candidate.name} {...candidate} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="pt-7" aria-labelledby="position-Councilors">
          <h2 id="position-Councilors" className="font-editorial text-2xl leading-tight">
            {positions[2].title}
          </h2>
          <p className="mb-4 mt-2 text-xs text-[#647357]">{positions[2].detail}</p>
          <ul className="space-y-3">
            {positions[2].candidates.map((candidate) => (
              <CandidateResults key={candidate.name} {...candidate} />
            ))}
          </ul>
        </section>

        <p className="mt-7 text-xs leading-5 text-[#647357]">
          Candidate order follows the ballot. Abstentions are shown separately from candidate
          selections. This page uses sample data for layout preview.
        </p>
      </main>
      <ResultsFooter />
    </>
  )
}

function UnreleasedResults() {
  return (
    <>
      <main className="mx-auto w-full max-w-[57rem] flex-1 px-[clamp(1.25rem,4.5vw,4rem)] pb-16 pt-[clamp(4rem,11vh,7rem)] text-[#324e1f]">
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
        <div className="mt-7 border border-[#b6c89f] px-5 py-5">
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
      <ResultsFooter />
    </>
  )
}

export function ElectionResultsPage({ released = false }: { released?: boolean }) {
  return (
    <div className="flex min-h-svh flex-col bg-[#faf3e0] [font-family:var(--font-inter),Arial,sans-serif] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#324e1f]">
      <ElectionNavigation activeSection="turnout" />
      {released ? <ReleasedResults /> : <UnreleasedResults />}
    </div>
  )
}
