import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CANDIDATES, CANDIDATE_OFFICES, candidateHref } from '@/lib/candidates'
import { CandidatesDirectory } from '../candidates-directory'
import { CandidateProfileNavigation } from '../candidate-profile-navigation'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

beforeEach(() => window.history.replaceState(null, '', '/candidates'))

describe('candidates directory', () => {
  it('combines office, party, and name filters, updates counts, and clears an empty result', () => {
    const page = render(<CandidatesDirectory />)
    const change = (label: string, value: string) => {
      fireEvent.change(screen.getByLabelText(label), { target: { value } })
      // The real Next.js hook rerenders after native history changes.
      page.rerender(<CandidatesDirectory />)
    }

    expect(screen.getByRole('status').textContent).toBe('4 candidates')
    change('Browse by office', CANDIDATE_OFFICES[0].id)
    expect(screen.getByRole('status').textContent).toBe('2 candidates')
    expect(screen.queryByRole('heading', { name: 'Vice Presidents' })).toBeNull()
    change('Browse by party', 'STAND')
    expect(screen.getByRole('status').textContent).toBe('1 candidate')
    change('Search candidates', '  candidate a  ')
    expect(screen.getByRole('heading', { name: 'Candidate A' })).toBeTruthy()
    change('Search candidates', 'Candidate B')
    expect(screen.getByRole('status').textContent).toBe('0 candidates')
    expect(screen.getByRole('heading', { name: 'No candidates found.' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    page.rerender(<CandidatesDirectory />)
    expect(screen.getByRole('status').textContent).toBe('4 candidates')
    expect(window.location.search).toBe('')
  })

  it('restores URL filters and carries them into the matching candidate profile', () => {
    window.history.replaceState(null, '', '/candidates?party=Independent&q=candidate')
    render(<CandidatesDirectory />)
    expect((screen.getByLabelText('Browse by party') as HTMLSelectElement).value).toBe(
      'Independent',
    )
    expect((screen.getByLabelText('Search candidates') as HTMLInputElement).value).toBe('candidate')
    expect(screen.getByRole('status').textContent).toBe('1 candidate')
    const card = screen.getByRole('listitem')
    expect(within(card).getByRole('heading').textContent).toBe('Candidate D')
    const link = within(card).getByRole('link')
    expect(link.textContent).toContain('View profile')
    expect(link.getAttribute('href')).toBe(
      `${candidateHref(CANDIDATES[3].id)}?party=Independent&q=candidate`,
    )
  })

  it('ignores unknown office and party values without hiding the directory', () => {
    window.history.replaceState(null, '', '/candidates?office=missing&party=missing')
    render(<CandidatesDirectory />)
    expect(screen.getByRole('status').textContent).toBe('4 candidates')
    expect((screen.getByLabelText('Browse by office') as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText('Browse by party') as HTMLSelectElement).value).toBe('')
  })
})

describe('profile navigation', () => {
  it('preserves filters on previous and next links across offices, discarding unrelated query parameters', () => {
    window.history.replaceState(
      null,
      '',
      `${candidateHref(CANDIDATES[2].id)}?party=STAND&q=Candidate&returnTo=https://example.org`,
    )
    render(
      <CandidateProfileNavigation
        previousCandidate={CANDIDATES[1]}
        nextCandidate={CANDIDATES[3]}
      />,
    )
    expect(screen.getByRole('link', { name: /Previous candidate/ }).getAttribute('href')).toBe(
      `${candidateHref(CANDIDATES[1].id)}?party=STAND&q=Candidate`,
    )
    expect(screen.getByRole('link', { name: /Next candidate/ }).getAttribute('href')).toBe(
      `${candidateHref(CANDIDATES[3].id)}?party=STAND&q=Candidate`,
    )
  })

  it('does not offer next-candidate navigation at the end of the ballot order', () => {
    render(<CandidateProfileNavigation previousCandidate={CANDIDATES[2]} />)
    expect(screen.queryByRole('link', { name: /Next candidate/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Previous candidate/ }).getAttribute('href')).toBe(
      candidateHref(CANDIDATES[2].id),
    )
    expect(screen.queryByRole('link', { name: 'Back to candidates' })).toBeNull()
  })

  it('offers only next-candidate navigation at the start of the ballot order', () => {
    render(<CandidateProfileNavigation nextCandidate={CANDIDATES[1]} />)
    expect(screen.queryByRole('link', { name: /Previous candidate/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Next candidate/ }).getAttribute('href')).toBe(
      candidateHref(CANDIDATES[1].id),
    )
  })

  it('keeps the top All candidates link pointing to the filtered directory', () => {
    window.history.replaceState(
      null,
      '',
      `${candidateHref(CANDIDATES[1].id)}?party=Tingog&q=Candidate`,
    )
    render(<CandidateProfileNavigation top />)
    expect(screen.getByRole('link', { name: 'All candidates' }).getAttribute('href')).toBe(
      '/candidates?party=Tingog&q=Candidate',
    )
    expect(screen.queryByRole('link', { name: /Previous candidate|Next candidate/ })).toBeNull()
  })
})
