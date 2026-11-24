import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CANDIDATES, CANDIDATE_OFFICES, candidateHref } from '@/lib/candidates'
import { CandidatesDirectory } from '../candidates-directory'
import { CandidateProfile } from '../candidate-profile'
import { CandidateProfileNavigation } from '../candidate-profile-navigation'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

const party = 'TINGOG!'
const partyQuery = new URLSearchParams({ party }).toString()

beforeEach(() => window.history.replaceState(null, '', '/candidates'))

describe('candidates directory', () => {
  it('combines office, party, and name filters, updates counts, and clears an empty result', () => {
    const page = render(<CandidatesDirectory />)
    const choose = (label: RegExp, listName: string, option: string) => {
      const trigger = screen.getByRole('button', { name: label })
      fireEvent.click(trigger)
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      const options = within(screen.getByRole('list', { name: listName }))
      fireEvent.click(options.getByRole('button', { name: option }))
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      page.rerender(<CandidatesDirectory />)
    }
    const search = (value: string) => {
      fireEvent.change(screen.getByLabelText('Search candidates'), { target: { value } })
      // The real Next.js hook rerenders after native history changes.
      page.rerender(<CandidatesDirectory />)
    }

    expect(screen.getByRole('status').textContent).toBe('15 candidates')
    choose(/^Browse by office /, 'Browse by office', CANDIDATE_OFFICES[0].title)
    expect(screen.getByRole('status').textContent).toBe('2 candidates')
    expect(screen.queryByRole('heading', { name: 'Vice President' })).toBeNull()
    choose(/^Browse by party /, 'Browse by party', party)
    expect(screen.getByRole('status').textContent).toBe('1 candidate')
    search('  gavas  ')
    expect(screen.getByRole('heading', { name: 'Gavas, Mark Lawrence L.' })).toBeTruthy()
    search('Ungab')
    expect(screen.getByRole('status').textContent).toBe('0 candidates')
    expect(screen.getByRole('heading', { name: 'No candidates found.' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    page.rerender(<CandidatesDirectory />)
    expect(screen.getByRole('status').textContent).toBe('15 candidates')
    expect(window.location.search).toBe('')
  })

  it('restores URL filters and carries them into the matching candidate profile', () => {
    window.history.replaceState(null, '', `/candidates?${partyQuery}&q=Solibaga`)
    render(<CandidatesDirectory />)
    expect(screen.getByRole('button', { name: `Browse by party ${party}` })).toBeTruthy()
    expect((screen.getByLabelText('Search candidates') as HTMLInputElement).value).toBe('Solibaga')
    expect(screen.getByRole('status').textContent).toBe('1 candidate')
    const card = screen.getByRole('listitem')
    expect(within(card).getByRole('heading').textContent).toBe('Solibaga, Sean Joseph')
    const link = within(card).getByRole('link')
    expect(link.textContent).toContain('View profile')
    expect(link.getAttribute('href')).toBe(
      `/candidates/sean-joseph-solibaga?${partyQuery}&q=Solibaga`,
    )
  })

  it('ignores unknown office and party values without hiding the directory', () => {
    window.history.replaceState(null, '', '/candidates?office=missing&party=missing')
    render(<CandidatesDirectory />)
    expect(screen.getByRole('status').textContent).toBe('15 candidates')
    expect(screen.getByRole('button', { name: 'Browse by office All offices' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Browse by party All parties' })).toBeTruthy()
  })
})

describe('profile navigation', () => {
  it('preserves filters on previous and next links across offices, discarding unrelated query parameters', () => {
    window.history.replaceState(
      null,
      '',
      `${candidateHref(CANDIDATES[4].id)}?${partyQuery}&q=Arizobal&returnTo=https://example.org`,
    )
    render(
      <CandidateProfileNavigation
        previousCandidate={CANDIDATES[3]}
        nextCandidate={CANDIDATES[5]}
      />,
    )
    expect(screen.getByRole('link', { name: /Previous candidate/ }).getAttribute('href')).toBe(
      `${candidateHref(CANDIDATES[3].id)}?${partyQuery}&q=Arizobal`,
    )
    expect(screen.getByRole('link', { name: /Next candidate/ }).getAttribute('href')).toBe(
      `${candidateHref(CANDIDATES[5].id)}?${partyQuery}&q=Arizobal`,
    )
  })

  it('does not offer next-candidate navigation at the end of the ballot order', () => {
    const previousCandidate = CANDIDATES.at(-2)!
    render(<CandidateProfileNavigation previousCandidate={previousCandidate} />)
    expect(screen.queryByRole('link', { name: /Next candidate/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Previous candidate/ }).getAttribute('href')).toBe(
      candidateHref(previousCandidate.id),
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
    window.history.replaceState(null, '', `/candidates/princess-jannah-ungab?${partyQuery}&q=Ungab`)
    render(<CandidateProfileNavigation top />)
    expect(screen.getByRole('link', { name: 'All candidates' }).getAttribute('href')).toBe(
      `/candidates?${partyQuery}&q=Ungab`,
    )
    expect(screen.queryByRole('link', { name: /Previous candidate|Next candidate/ })).toBeNull()
  })
})

describe('candidate profiles', () => {
  it('shows all submitted projects and academic details for the president', () => {
    render(<CandidateProfile candidate={CANDIDATES[0]} />)
    const projects = screen.getByRole('region', { name: 'Advocacies and projects' })
    expect(within(projects).getAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(
      within(projects).getByRole('heading', { name: 'Constitutional Convention' }),
    ).toBeTruthy()
    expect(screen.getByText('BS Psychology')).toBeTruthy()
  })

  it('shows the supplied candidate number and omits blank personal details', () => {
    const candidate = CANDIDATES.find(({ id }) => id === 'kent-deloria-reyes')!
    render(<CandidateProfile candidate={candidate} />)
    expect(screen.getByText('Councilors · Candidate #7')).toBeTruthy()
    expect(screen.queryByText('Motto')).toBeNull()
    expect(screen.queryByText('As a person')).toBeNull()
    expect(screen.queryByText('As a student leader')).toBeNull()
    expect(screen.getByRole('heading', { name: 'FINANCE-ABLE CAROLINIANS' })).toBeTruthy()
  })
})
