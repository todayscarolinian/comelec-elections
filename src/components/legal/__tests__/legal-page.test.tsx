import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PRIVACY_POLICY } from '@/content/legal/privacy'
import { TERMS_OF_SERVICE } from '@/content/legal/terms'
import type { LegalDocument } from '@/content/legal/types'
import { LegalPage, formatLegalDate } from '../legal-page'

// next/font needs the Next.js compiler; tests only need the class names it returns.
vi.mock('next/font/google', () => ({ Inter: () => ({ variable: 'font-inter' }) }))
vi.mock('next/font/local', () => ({ default: () => ({ variable: 'font-local' }) }))
// The navigation reads the session and database on the server; it is covered by its own tests.
vi.mock('@/components/election/election-navigation', () => ({
  ElectionNavigation: () => <header />,
}))

const documents = [
  ['privacy', PRIVACY_POLICY],
  ['terms', TERMS_OF_SERVICE],
] as const

describe('legal page', () => {
  it.each(documents)('renders the %s title, date and every section', (_name, content) => {
    render(<LegalPage content={content} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(content.title)
    const updated = screen.getByText(formatLegalDate(content.lastUpdated))
    expect(updated.getAttribute('datetime')).toBe(content.lastUpdated)
    for (const { id, heading } of content.sections) {
      const sectionHeading = screen.getByRole('heading', { level: 2, name: heading })
      expect(sectionHeading.closest('section')?.id).toBe(id)
    }
  })

  it.each(documents)('links the %s table of contents to each section', (_name, content) => {
    render(<LegalPage content={content} />)

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const hrefs = within(toc)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(content.sections.map(({ id }) => `#${id}`))
  })

  it('links each document to the other', () => {
    render(<LegalPage content={PRIVACY_POLICY} />)
    expect(screen.getByRole('link', { name: 'Terms of Service' }).getAttribute('href')).toBe(
      '/terms',
    )
  })

  it('shows the draft banner only while the wording is a draft', () => {
    const { unmount } = render(<LegalPage content={PRIVACY_POLICY} />)
    expect(screen.getByRole('note').textContent).toContain('Draft, pending commission review')
    unmount()

    const final: LegalDocument = { ...PRIVACY_POLICY, status: 'final' }
    render(<LegalPage content={final} />)
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('adds Privacy and Terms to the footer navigation', () => {
    render(<LegalPage content={TERMS_OF_SERVICE} />)
    const footer = screen.getByRole('navigation', { name: 'Footer navigation' })
    expect(within(footer).getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe(
      '/privacy',
    )
    expect(within(footer).getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms')
  })

  it('formats dates without shifting the day across time zones', () => {
    expect(formatLegalDate('2026-11-21')).toBe('November 21, 2026')
  })
})
