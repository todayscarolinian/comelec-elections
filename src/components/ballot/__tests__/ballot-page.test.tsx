import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ELECTION } from '@/election'
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
const [first, vicePresident, councilors] = ELECTION.questions
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
  expect(submitButton('Review ballot').disabled).toBe(true)
  fireEvent.click(
    within(screen.getByRole('group', { name: first.title })).getByText(candidate.name),
  )
  expect(submitButton('Review ballot').disabled).toBe(true)
  for (const office of [vicePresident, councilors]) {
    fireEvent.click(within(screen.getByRole('group', { name: office.title })).getByText('Abstain'))
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

  it('shows all 15 candidates after disclosure and clears Councilor picks when abstaining', async () => {
    showBallot()
    await acknowledgeDisclosure()
    fireEvent.click(submitButton('Continue to ballot'))

    const choices = (office: string, role: 'radio' | 'checkbox') => {
      const group = within(screen.getByRole('group', { name: office }))
      const abstain = group.getByRole(role, { name: 'Abstain' })
      return group.getAllByRole<HTMLInputElement>(role).filter((option) => option !== abstain)
    }
    expect(choices('President', 'radio')).toHaveLength(2)
    expect(choices('Vice President', 'radio')).toHaveLength(2)
    expect(choices('Councilors', 'checkbox')).toHaveLength(11)

    const group = within(screen.getByRole('group', { name: 'Councilors' }))
    expect(group.getByText('Choose up to 11 candidates or abstain.')).toBeTruthy()
    const councilor = group.getByRole<HTMLInputElement>('checkbox', {
      name: 'Gacrama, Tristan Jude G.',
    })
    fireEvent.click(councilor)
    expect(councilor.checked).toBe(true)
    fireEvent.click(group.getByRole('checkbox', { name: 'Abstain' }))
    expect(councilor.checked).toBe(false)
  })

  it('requires disclosure, lets a voter edit and review, then casts once and clears choices', async () => {
    showBallot()
    await acknowledgeDisclosure()
    fireEvent.click(submitButton('Continue to ballot'))
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
          [first.id]: { candidateIds: [candidate.id] },
          [vicePresident.id]: { abstain: true },
          [councilors.id]: { abstain: true },
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
    fireEvent.click(submitButton('Continue to ballot'))
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
