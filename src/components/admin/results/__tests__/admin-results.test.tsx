import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ELECTION } from '@/election'
import { buildResults } from '@/server/trpc/api/v1/results/core/buildResults'

const { results, dashboard, bySchool, release } = vi.hoisted(() => ({
  results: vi.fn(),
  dashboard: vi.fn(),
  bySchool: vi.fn(),
  release: vi.fn(),
}))

vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    results: {
      get: { queryOptions: () => ({ queryKey: ['results', 'get'], queryFn: results }) },
    },
    admin: {
      getDashboard: {
        queryOptions: () => ({ queryKey: ['admin', 'getDashboard'], queryFn: dashboard }),
      },
      getResultsBySchool: {
        queryOptions: () => ({ queryKey: ['admin', 'getResultsBySchool'], queryFn: bySchool }),
      },
      releaseResults: { mutationOptions: () => ({ mutationFn: release }) },
    },
  }),
}))

import { AdminResults } from '../admin-results'

const [question] = ELECTION.questions
const [candidate] = question.candidates

function tally(votes: number) {
  return buildResults({
    election: ELECTION,
    tally: [{ questionId: question.id, candidateId: candidate.id, votes }],
    countedBallots: votes,
    heldPending: 0,
    heldRejected: 0,
    releasedAt: null,
  })
}

function showResults() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AdminResults />
    </QueryClientProvider>,
  )
}

describe('AdminResults by School', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    results.mockResolvedValue(tally(9))
    dashboard.mockResolvedValue({ phase: 'VOTING_OPEN' })
    bySchool.mockResolvedValue([
      { school: 'SAFAD', label: 'SAFAD', results: tally(7) },
      { school: 'SAS', label: 'SAS', results: tally(2) },
    ])
  })

  it('loads per-School Results only when an Admin asks, since pre-release views are audited', async () => {
    showResults()
    await screen.findByRole('button', { name: 'Show results by School' })
    expect(bySchool).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Show results by School' }))

    const section = screen.getByRole('region', { name: 'Results by School' })
    const select = await within(section).findByLabelText('School')
    expect(bySchool).toHaveBeenCalledTimes(1)
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['SAFAD (7 counted)', 'SAS (2 counted)'])
    expect(within(section).getByText('7 votes')).toBeDefined()

    fireEvent.change(select, { target: { value: '1' } })
    expect(within(section).getByText('2 votes')).toBeDefined()
  })
})
