import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ElectionAccountMenu } from '../election-account-menu'

const { signOutFromElection } = vi.hoisted(() => ({
  signOutFromElection: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/auth/actions', () => ({ signOutFromElection }))

it('shows the signed-in account, dismisses the menu, and submits sign-out', async () => {
  render(
    <ElectionAccountMenu account={{ name: 'Alex Santos', email: 'alex.santos@example.org' }} />,
  )
  const trigger = screen.getByLabelText('Account menu for Alex Santos')
  const menu = trigger.closest('details')!

  fireEvent.click(trigger)
  expect(menu.open).toBe(true)
  expect(screen.getByText('alex.santos@example.org')).toBeTruthy()
  const signOut = screen.getByRole('button', { name: 'Sign out' })

  signOut.focus()
  fireEvent.keyDown(signOut, { key: 'Escape' })
  expect(menu.open).toBe(false)
  expect(document.activeElement).toBe(trigger)

  fireEvent.click(trigger)
  fireEvent.pointerDown(document.body)
  expect(menu.open).toBe(false)

  fireEvent.click(trigger)
  fireEvent.submit(signOut.closest('form')!)
  await waitFor(() => expect(signOutFromElection).toHaveBeenCalledTimes(1))
})
