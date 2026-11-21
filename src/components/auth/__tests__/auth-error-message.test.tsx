import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthErrorMessage } from '../auth-error-message'

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next-auth/react', () => ({ signIn }))

beforeEach(() => signIn.mockReset().mockResolvedValue(undefined))

describe('authentication error message', () => {
  it('explains why non-organization accounts cannot sign in', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain="example.com" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Use your university account.',
    )
    expect(
      screen.getByText('Only @example.com Google Workspace accounts can sign in.'),
    ).toBeTruthy()
    expect(
      screen.getByText(/Please choose your university account in the Google account picker/),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/')
  })

  it('links to the Privacy Policy', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain="example.com" />)
    expect(screen.getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe(
      '/privacy',
    )
  })

  it('uses the configured domain rather than a hardcoded placeholder', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain="organization.edu" />)
    expect(
      screen.getByText('Only @organization.edu Google Workspace accounts can sign in.'),
    ).toBeTruthy()
  })

  it('displays the normalized configured domain', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain=" USC.EDU.PH " />)
    expect(screen.getByText('Only @usc.edu.ph Google Workspace accounts can sign in.')).toBeTruthy()
  })

  it.each([undefined, '', '   '])('reports missing domain configuration: %j', (allowedDomain) => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain={allowedDomain} />)
    expect(
      screen.getByText(
        'Organization sign-in is not configured. Contact the election administrator.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Only @/)).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByRole('link', { name: 'Back to home' })).toBeTruthy()
  })

  it('does not blame the account when the OAuth client is misconfigured', () => {
    render(<AuthErrorMessage error="Configuration" allowedDomain="example.com" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Sign-in unavailable')
    expect(
      screen.getByText(
        'Organization sign-in is not configured. Contact the election administrator.',
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it.each(['OAuthCallbackError', '<script>private-error</script>', undefined])(
    'shows a safe generic message for other failures: %j',
    (error) => {
      render(<AuthErrorMessage error={error} allowedDomain="example.com" />)
      expect(
        screen.getByText('We could not complete your Google sign-in. Please try again.'),
      ).toBeTruthy()
      expect(screen.queryByText(/Only @/)).toBeNull()
      expect(screen.queryByText(/private-error/)).toBeNull()
      expect(screen.getByRole('button', { name: 'Try Google sign-in again' })).toBeTruthy()
    },
  )

  it('offers a retry for temporary failures without blaming the account', () => {
    render(<AuthErrorMessage error="SignInUnavailable" allowedDomain="usc.edu.ph" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Please try again shortly.')
    expect(
      screen.getByText('Sign-in is temporarily unavailable. Please try again in a moment.'),
    ).toBeTruthy()
    expect(screen.queryByText(/Only @/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Try Google sign-in again' })).toBeTruthy()
  })

  it('retries with Google using the normal post-sign-in destination flow', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain="example.com" />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose another Google account' }))
    expect(signIn).toHaveBeenCalledExactlyOnceWith('google', { redirectTo: '/auth/sign-in' })
    expect(
      (screen.getByRole('button', { name: 'Redirecting to Google…' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
