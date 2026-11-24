import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TurnoutCount } from '../turnout-count'

function renderCount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TurnoutCount />
    </QueryClientProvider>,
  )
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('TurnoutCount', () => {
  it('shows Ballots cast, approved Voters and the Election status from /api/turnout', async () => {
    const fetchMock = mockFetch(
      Response.json({ electionStatus: 'OPEN', ballotsCast: 1234, approvedVoters: 5678 }),
    )

    renderCount()

    expect(await screen.findByText('1,234')).toBeTruthy()
    expect(screen.getByText('Ballots cast')).toBeTruthy()
    expect(screen.getByText('5,678 approved Voters · Voting is open')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/turnout', { cache: 'no-store' })
  })

  it('says voting is closed when the Election is closed', async () => {
    mockFetch(Response.json({ electionStatus: 'CLOSED', ballotsCast: 1, approvedVoters: 1 }))

    renderCount()

    expect(await screen.findByText('Ballot cast')).toBeTruthy()
    expect(screen.getByText('1 approved Voter · Voting is closed')).toBeTruthy()
  })

  it('shows a loading state before the first response', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )

    renderCount()

    expect(screen.getByText('Loading turnout…')).toBeTruthy()
  })

  it('says Turnout is unavailable when the route fails', async () => {
    mockFetch(Response.json({ error: 'Turnout is temporarily unavailable.' }, { status: 503 }))

    renderCount()

    expect(await screen.findByText('Live turnout is unavailable.')).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()
  })
})
