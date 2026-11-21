'use client'

import { ChevronDown, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import {
  CANDIDATES,
  CANDIDATE_OFFICES,
  CANDIDATE_PARTIES,
  candidateMatches,
  candidateQueryString,
  readCandidateFilters,
  type CandidateFilters,
} from '@/lib/candidates'
import { CandidateCard } from './candidate-card'

const fieldClass =
  'min-h-12 w-full rounded-none border border-comelec-sage bg-comelec-cream px-3 text-sm text-comelec-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-comelec-forest'

export function CandidatesDirectory() {
  const searchParams = useSearchParams()
  const filters = readCandidateFilters(searchParams)
  const query = candidateQueryString(filters)
  const visible = CANDIDATES.filter((candidate) => candidateMatches(candidate, filters))
  const hasFilters = !!(filters.office || filters.party || filters.q)

  function updateFilters(patch: Partial<CandidateFilters>) {
    const next = { ...readCandidateFilters(new URLSearchParams(window.location.search)), ...patch }
    // Next.js integrates native history updates with useSearchParams. Keep typing
    // immediate and avoid a server request or a history entry for every keystroke.
    window.history.replaceState(null, '', `/candidates${candidateQueryString(next)}`)
  }

  return (
    <>
      <search
        aria-label="Find candidates"
        className="mt-10 grid items-end gap-5 md:grid-cols-[1fr_1fr_0.65fr_1fr] lg:mt-12"
      >
        <div>
          <label htmlFor="candidate-office" className="mb-2 block text-xs text-comelec-olive">
            Browse by office
          </label>
          <div className="relative">
            <select
              id="candidate-office"
              value={filters.office}
              onChange={(event) => updateFilters({ office: event.target.value })}
              className={`${fieldClass} appearance-none pr-10`}
            >
              <option value="">All offices</option>
              {CANDIDATE_OFFICES.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.title}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute end-3 top-4 size-4"
            />
          </div>
        </div>
        <div>
          <label htmlFor="candidate-party" className="mb-2 block text-xs text-comelec-olive">
            Browse by party
          </label>
          <div className="relative">
            <select
              id="candidate-party"
              value={filters.party}
              onChange={(event) => updateFilters({ party: event.target.value })}
              className={`${fieldClass} appearance-none pr-10`}
            >
              <option value="">All parties</option>
              {CANDIDATE_PARTIES.map((party) => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute end-3 top-4 size-4"
            />
          </div>
        </div>
        <div className="md:col-start-4">
          <label htmlFor="candidate-search" className="mb-2 block text-xs text-comelec-olive">
            Search candidates
          </label>
          <div className="relative">
            <input
              id="candidate-search"
              type="search"
              placeholder="Search candidates"
              autoComplete="off"
              value={filters.q}
              onChange={(event) => updateFilters({ q: event.target.value })}
              className={`${fieldClass} border-x-0 pr-10 placeholder:text-comelec-olive`}
            />
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute end-3 top-4 size-4 text-comelec-olive"
            />
          </div>
        </div>
      </search>

      <div className="mt-5 flex min-h-12 flex-wrap items-center justify-between gap-x-4 border-t border-comelec-sage/65 py-3 text-xs">
        <output aria-live="polite" aria-atomic="true">
          {visible.length} {visible.length === 1 ? 'candidate' : 'candidates'}
        </output>
        {hasFilters ? (
          <button
            type="button"
            className="min-h-11 cursor-pointer underline underline-offset-4"
            onClick={() => updateFilters({ office: '', party: '', q: '' })}
          >
            Clear filters
          </button>
        ) : (
          <p className="text-comelec-olive">Filter by office and party</p>
        )}
      </div>

      {visible.length ? (
        <div className="mt-5 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:gap-y-14">
          {CANDIDATE_OFFICES.map((office) => {
            const candidates = visible.filter((candidate) => candidate.officeId === office.id)
            if (!candidates.length) return null
            const wide = office.candidates.length > 2
            return (
              <section
                key={office.id}
                aria-labelledby={`office-${office.id}`}
                className={wide ? 'md:col-span-2' : undefined}
              >
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 id={`office-${office.id}`} className="font-display text-2xl italic">
                    {office.title}
                  </h2>
                  <p className="text-right text-[0.625rem] tracking-[0.04em] text-comelec-olive uppercase">
                    {String(candidates.length).padStart(2, '0')}{' '}
                    {candidates.length === 1 ? 'candidate' : 'candidates'}
                  </p>
                </div>
                <ul
                  className={`grid gap-5 min-[360px]:grid-cols-2 lg:gap-7 ${wide ? 'md:grid-cols-4' : ''}`}
                >
                  {candidates.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} query={query} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="border-b border-comelec-sage py-20 text-center">
          <h2 className="font-display text-3xl italic">No candidates found.</h2>
          <p className="mt-3 text-sm text-comelec-olive">
            Try a different name, office, or party, or clear your filters to see everyone.
          </p>
        </div>
      )}
    </>
  )
}

export function CandidatesDirectoryFallback() {
  return (
    <div className="mt-12" aria-busy="true" aria-label="Loading candidates">
      <output className="text-sm text-comelec-olive">Loading candidates…</output>
      <div aria-hidden="true" className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        {CANDIDATES.map((candidate) => (
          <div
            key={candidate.id}
            className="aspect-square bg-comelec-sage/20 motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
