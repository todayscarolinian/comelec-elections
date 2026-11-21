'use client'

import { Search } from 'lucide-react'
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
import { CandidateOfficeGrid } from './candidate-office-grid'
import { CandidateFilter } from './candidate-filter'

const fieldClass =
  'min-h-12 w-full rounded-md border border-comelec-olive/45 bg-comelec-cream px-4 text-sm text-comelec-forest hover:border-comelec-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-comelec-forest motion-safe:transition-colors motion-safe:duration-150'

const officeOptions = [
  { value: '', label: 'All offices' },
  ...CANDIDATE_OFFICES.map(({ id, title }) => ({ value: id, label: title })),
]
const partyOptions = [
  { value: '', label: 'All parties' },
  ...CANDIDATE_PARTIES.map((party) => ({ value: party, label: party })),
]

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
        className="mt-10 grid items-end gap-5 md:grid-cols-3 lg:mt-12"
      >
        <CandidateFilter
          label="Browse by office"
          options={officeOptions}
          value={filters.office}
          className={fieldClass}
          onChange={(office) => updateFilters({ office })}
        />
        <CandidateFilter
          label="Browse by party"
          options={partyOptions}
          value={filters.party}
          className={fieldClass}
          onChange={(party) => updateFilters({ party })}
        />
        <div>
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
              className={`${fieldClass} pe-11 placeholder:text-comelec-olive`}
            />
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-comelec-olive"
            />
          </div>
        </div>
      </search>

      <div className="mt-5 flex min-h-12 flex-wrap items-center justify-between gap-x-4 border-t border-comelec-sage/65 py-3 text-xs">
        <output aria-live="polite" aria-atomic="true">
          {visible.length} {visible.length === 1 ? 'candidate' : 'candidates'}
        </output>
        {hasFilters && (
          <button
            type="button"
            className="min-h-11 cursor-pointer underline underline-offset-4"
            onClick={() => updateFilters({ office: '', party: '', q: '' })}
          >
            Clear filters
          </button>
        )}
      </div>

      {visible.length ? (
        <div className="mt-5">
          <CandidateOfficeGrid candidates={visible} query={query} />
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
