import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TurnoutCount } from '../turnout-count'
import { TURNOUT_REFRESH_MS, TURNOUT_STORAGE_KEY } from '../turnout-snapshot'

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

function turnoutCharacters(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-turnout-character]'))
}

function displayedCount(container: HTMLElement) {
  return turnoutCharacters(container)
    .map((character) => character.textContent)
    .join('')
}

afterEach(() => {
  window.localStorage.removeItem(TURNOUT_STORAGE_KEY)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('TurnoutCount', () => {
  it('shows Ballots cast, approved Voters and the Election status from /api/turnout', async () => {
    const fetchMock = mockFetch(
      Response.json({ electionStatus: 'OPEN', ballotsCast: 1234, approvedVoters: 5678 }),
    )

    const { container } = renderCount()

    expect(await screen.findByText('1,234 ballots cast reported')).toBeTruthy()
    expect(displayedCount(container)).toBe('1,234')
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

  it('reuses the browser snapshot and resumes animating to the reported total after a reload', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        Response.json({ electionStatus: 'OPEN', ballotsCast: 200, approvedVoters: 500 }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    window.localStorage.setItem(
      TURNOUT_STORAGE_KEY,
      JSON.stringify({
        electionStatus: 'OPEN',
        ballotsCast: 100,
        approvedVoters: 500,
        receivedAt: Date.now(),
      }),
    )

    const first = renderCount()
    await act(() => vi.advanceTimersByTimeAsync(TURNOUT_REFRESH_MS - 1000))
    expect(displayedCount(first.container)).toBe('100')
    expect(fetchMock).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(1100))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(displayedCount(first.container)).toBe('100')
    expect(screen.getByText('200 ballots cast reported')).toBeTruthy()

    await act(() => vi.advanceTimersByTimeAsync(30_000))
    const intermediate = displayedCount(first.container)
    expect(Number(intermediate)).toBeGreaterThan(100)
    expect(Number(intermediate)).toBeLessThan(200)

    first.unmount()
    const second = renderCount()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(displayedCount(second.container)).toBe(intermediate)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(displayedCount(second.container)).toBe('200')
    expect(screen.queryByText('Updating to the latest reported count.')).toBeNull()
  })

  it.each([
    [12345, 12346, '6'],
    [1299, 1300, '300'],
    [999, 1000, '1000'],
  ])('rolls only the digits that change from %i to %i', async (from, ballotsCast, rolling) => {
    vi.useFakeTimers()
    window.localStorage.setItem(
      TURNOUT_STORAGE_KEY,
      JSON.stringify({
        electionStatus: 'OPEN',
        ballotsCast,
        approvedVoters: 20_000,
        receivedAt: Date.now(),
        growth: { from, offsets: [500] },
      }),
    )

    const { container } = renderCount()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(displayedCount(container)).toBe(from.toLocaleString('en-US'))

    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(displayedCount(container)).toBe(ballotsCast.toLocaleString('en-US'))
    expect(
      turnoutCharacters(container)
        .filter((character) => character.className.includes('election-turnout-in'))
        .map((character) => character.textContent)
        .join(''),
    ).toBe(rolling)
  })
})
