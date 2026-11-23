import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ELECTION } from '@/election'
import { CANDIDATES } from '@/lib/candidates'
import { BallotPage } from '../ballot-page'
import { BallotSignInDialog } from '../ballot-sign-in'

const { election, myStatus, registration, cast, signIn } = vi.hoisted(() => ({
  election: vi.fn(),
  myStatus: vi.fn(),
  registration: vi.fn(),
  cast: vi.fn(),
  signIn: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ signIn }))

vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({
    election: {
      get: { queryOptions: () => ({ queryKey: ['election', 'get'], queryFn: election }) },
    },
    ballot: {
      myStatus: { queryOptions: () => ({ queryKey: ['ballot', 'myStatus'], queryFn: myStatus }) },
      cast: { mutationOptions: () => ({ mutationFn: cast }) },
    },
    registration: {
      getMine: {
        queryOptions: () => ({ queryKey: ['registration', 'getMine'], queryFn: registration }),
      },
    },
  }),
}))

const account = { name: 'Alex Santos', email: 'alex.santos@example.org' }
const first = ELECTION.questions[0]
const candidate = first.candidates[0]
const submitButton = (label: string) =>
  screen.getByRole<HTMLButtonElement>('button', { name: label })

function showBallot() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <BallotPage />
      <BallotSignInDialog />
    </QueryClientProvider>,
  )
}

async function acknowledgeDisclosure() {
  const disclosure = await screen.findByRole('checkbox', {
    name: /my ballot can be viewed by the election commission/i,
  })
  expect(submitButton('Continue to ballot').disabled).toBe(true)
  fireEvent.click(disclosure)
}

function answerBallot() {
  fireEvent.click(submitButton('Continue to ballot'))
  expect(submitButton('Review ballot').disabled).toBe(true)
  fireEvent.click(
    within(screen.getByRole('group', { name: first.title })).getByText(candidate.name),
  )
  expect(submitButton('Review ballot').disabled).toBe(true)
  for (const question of ELECTION.questions.slice(1)) {
    fireEvent.click(
      within(screen.getByRole('group', { name: question.title })).getByText('Abstain'),
    )
  }
  fireEvent.click(submitButton('Review ballot'))
}

describe('BallotPage', () => {
  beforeEach(() => {
    election.mockReset().mockResolvedValue({ status: 'OPEN' })
    myStatus.mockReset().mockResolvedValue({ status: 'can_vote' })
    registration.mockReset().mockResolvedValue({
      account,
      registration: { status: 'APPROVED', school: 'SAFAD', rejectionReason: null },
      canSubmit: true,
    })
    cast.mockReset().mockResolvedValue({ ok: true, held: false })
  })

  it('opens the sign-in dialog and returns to the ballot after Google sign-in', async () => {
    myStatus.mockRejectedValue({ data: { code: 'UNAUTHORIZED' } })
    signIn.mockReset().mockResolvedValue(undefined)
    // jsdom does not implement showModal.
    const prototype = HTMLDialogElement.prototype
    Object.defineProperty(prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true
      },
    })

    try {
      showBallot()
      const dialog = await screen.findByRole('dialog', { name: 'Sign in to vote' })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Continue with Google' }))
      expect(signIn).toHaveBeenCalledExactlyOnceWith('google', { redirectTo: '/ballot' })
      expect(registration).not.toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(prototype, 'showModal')
    }
  })

  it('directs voters without a registration to the registration page', async () => {
    myStatus.mockResolvedValue({ status: 'not_registered' })
    showBallot()

    const link = await screen.findByRole('link', { name: 'Go to registration' })
    expect(link.getAttribute('href')).toBe('/register')
    expect(cast).not.toHaveBeenCalled()
  })

  it('shows each candidate’s portrait alongside their ballot option', async () => {
    showBallot()
    await acknowledgeDisclosure()
    fireEvent.click(submitButton('Continue to ballot'))

    for (const question of ELECTION.questions) {
      const group = within(screen.getByRole('group', { name: question.title }))
      for (const candidate of question.candidates) {
        const option = group.getByRole(question.selectionLimit === 1 ? 'radio' : 'checkbox', {
          name: candidate.name,
        })
        const portrait = option.closest('label')?.querySelector('img')
        expect(portrait).toBeTruthy()
        const src = new URL(portrait!.src)
        const photo = CANDIDATES.find(({ id }) => id === candidate.id)?.photo
        expect(photo).toBeTruthy()
        expect(src.searchParams.get('url') ?? src.pathname).toBe(photo)
      }
      expect(group.getByText('Abstain').closest('label')?.querySelector('img')).toBeNull()
    }
  })

  it('opens the real candidate profile without changing the selected candidate', async () => {
    const prototype = HTMLDialogElement.prototype
    Object.defineProperty(prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true
      },
    })

    try {
      showBallot()
      await acknowledgeDisclosure()
      fireEvent.click(submitButton('Continue to ballot'))

      const selection = screen.getByRole<HTMLInputElement>('radio', { name: candidate.name })
      fireEvent.click(selection)
      fireEvent.click(submitButton('Details for Wagas, Dyane Jhen P.'))

      const preview = within(screen.getByRole('dialog', { name: 'Wagas, Dyane Jhen P.' }))
      expect(preview.getByText('President · Candidate #2 · STAND')).toBeTruthy()
      expect(preview.getByRole('link', { name: 'View full profile' }).getAttribute('href')).toBe(
        '/candidates/dyane-jhen-wagas',
      )
      expect(selection.checked).toBe(true)
      expect(cast).not.toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(prototype, 'showModal')
    }
  })

  it('requires disclosure, lets a voter edit and review, then casts once and clears choices', async () => {
    showBallot()
    await acknowledgeDisclosure()
    answerBallot()

    expect(cast).not.toHaveBeenCalled()
    fireEvent.click(submitButton(`Edit ${first.title}`))
    expect(screen.getByRole<HTMLInputElement>('radio', { name: candidate.name }).checked).toBe(true)
    fireEvent.click(submitButton('Review ballot'))
    fireEvent.click(submitButton('Cast my ballot'))
    await screen.findByRole('heading', { name: 'Your ballot has been cast.' })
    expect(screen.queryByText(candidate.name)).toBeNull()
    expect(cast).toHaveBeenCalledExactlyOnceWith(
      {
        disclosureAccepted: true,
        answers: {
          president: { candidateIds: [candidate.id] },
          'vice-president': { abstain: true },
          councilors: { abstain: true },
        },
      },
      expect.anything(),
    )
  })

  it('requires a separate acknowledgement before casting a held ballot', async () => {
    registration.mockResolvedValue({
      account,
      registration: { status: 'PENDING', school: 'SAFAD', rejectionReason: null },
      canSubmit: true,
    })
    cast.mockResolvedValue({ ok: true, held: true })
    showBallot()

    await acknowledgeDisclosure()
    expect(submitButton('Continue to ballot').disabled).toBe(true)
    fireEvent.click(
      screen.getByRole('checkbox', { name: /only counts if my registration is approved/i }),
    )
    answerBallot()
    fireEvent.click(submitButton('Cast my ballot'))
    await screen.findByRole('heading', { name: 'Your ballot is held.' })
    expect(cast).toHaveBeenCalledWith(
      expect.objectContaining({ heldAcknowledged: true }),
      expect.anything(),
    )
  })

  it('shows an existing ballot instead of allowing another one when voting is closed', async () => {
    election.mockResolvedValue({ status: 'CLOSED' })
    myStatus.mockResolvedValue({ status: 'already_voted' })
    showBallot()

    await screen.findByRole('heading', { name: 'You have already voted.' })
    expect(screen.queryByRole('button', { name: 'Cast my ballot' })).toBeNull()
  })
})
