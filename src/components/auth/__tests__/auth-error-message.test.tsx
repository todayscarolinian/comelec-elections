import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthErrorMessage } from '../auth-error-message'

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next-auth/react', () => ({ signIn }))

describe('authentication error message', () => {
  it('explains why non-organization accounts cannot sign in', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain="example.com" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Sign-in not allowed')
    expect(screen.getByText('Only @example.com organization accounts can sign in.')).toBeTruthy()
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
      screen.getByText('Only @organization.edu organization accounts can sign in.'),
    ).toBeTruthy()
  })

  it('displays the normalized configured domain', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain=" USC.EDU.PH " />)
    expect(screen.getByText('Only @usc.edu.ph organization accounts can sign in.')).toBeTruthy()
  })

  it.each([undefined, '', '   '])('reports missing domain configuration: %j', (allowedDomain) => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain={allowedDomain} />)
    expect(
      screen.getByText(
        'Organization sign-in is not configured. Contact the election administrator.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Only @/)).toBeNull()
  })

  it('does not blame the account when the OAuth client is misconfigured', () => {
    render(<AuthErrorMessage error="Configuration" allowedDomain="example.com" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Sign-in unavailable')
    expect(
      screen.getByText(
        'Organization sign-in is not configured. Contact the election administrator.',
      ),
    ).toBeTruthy()
  })

  it.each(['OAuthCallbackError', 'SignInUnavailable', '<script>private-error</script>', undefined])(
    'shows a safe generic message for other failures: %j',
    (error) => {
      render(<AuthErrorMessage error={error} allowedDomain="example.com" />)
      expect(
        screen.getByText('We could not complete your Google sign-in. Please try again.'),
      ).toBeTruthy()
      expect(screen.queryByText(/Only @/)).toBeNull()
      expect(screen.queryByText(/private-error/)).toBeNull()
    },
  )

  it('retries directly with Google and returns to registration after sign-in', () => {
    render(<AuthErrorMessage error="AccessDenied" allowedDomain="example.com" />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(signIn).toHaveBeenCalledWith('google', { redirectTo: '/register' })
  })
})
