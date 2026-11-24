import { render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ElectionResultsPage } from '../election-results-page'
import { ResultsPageSkeleton } from '../results-skeleton'
import { SAMPLE_RESULTS } from '../sample-results'

// The navigation reads the server session.
vi.mock('@/components/election/election-navigation', () => ({
  ElectionNavigation: () => null,
}))

afterEach(() => {
  vi.unstubAllEnvs()
})

it.each([
  ['loading', () => <ResultsPageSkeleton />],
  ['unreleased', () => <ElectionResultsPage results={null} />],
  ['released', () => <ElectionResultsPage results={SAMPLE_RESULTS} />],
  ['sample', () => <ElectionResultsPage results={SAMPLE_RESULTS} sample />],
] as const)('shows the public footer in the %s Results view', (_state, Page) => {
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST')
  render(<Page />)

  const footer = within(screen.getByRole('contentinfo'))
  const nav = within(footer.getByRole('navigation', { name: 'Footer navigation' }))
  expect(nav.queryByRole('link', { name: 'Registration' })).toBeNull()
  expect(nav.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy')
  expect(nav.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms')
  expect(nav.getByRole('button', { name: 'Cookie settings' })).toBeDefined()
})
