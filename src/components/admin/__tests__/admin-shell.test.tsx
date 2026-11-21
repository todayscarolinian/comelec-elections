import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/admin' } }))

vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }))
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: { pendingCount: 37 } }) }))
vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => ({ admin: { getRegistrationWindow: { queryOptions: () => ({}) } } }),
}))

import { AdminShell } from '../admin-shell'

function renderAt(path: string) {
  pathname.current = path
  return render(
    <AdminShell account={<span>chair@example.com</span>}>
      <p>Page body</p>
    </AdminShell>,
  )
}

describe('AdminShell', () => {
  it('links every admin destination', () => {
    renderAt('/admin')
    const nav = screen.getByRole('navigation', { name: 'Admin navigation' })
    expect(Array.from(nav.querySelectorAll('a')).map((link) => link.getAttribute('href'))).toEqual([
      '/admin',
      '/admin/registrations',
      '/admin/ballots',
      '/admin/results',
      '/admin/admins',
      '/admin/activity',
    ])
  })

  it.each([
    ['/admin', 'Dashboard'],
    ['/admin/registrations', 'Registrations'],
    ['/admin/ballots', 'Ballot audit'],
  ])('marks %s as the current page', (path, label) => {
    renderAt(path)
    const current = screen.getByRole('link', { current: 'page' })
    expect(current.textContent).toContain(label)
  })

  it('shows the pending registration count, the account and the page', () => {
    renderAt('/admin')
    expect(screen.getByLabelText('37 pending')).toBeTruthy()
    expect(screen.getByText('chair@example.com')).toBeTruthy()
    expect(screen.getByText('Page body')).toBeTruthy()
  })
})
