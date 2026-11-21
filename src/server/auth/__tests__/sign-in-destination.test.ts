// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSignInDestination } from '../sign-in-destination'

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({ default: { registration: { findUnique } } }))

describe('getSignInDestination', () => {
  beforeEach(() => findUnique.mockReset())

  it('sends a signed-in voter without a registration to the registration page', async () => {
    findUnique.mockResolvedValueOnce(null)
    await expect(getSignInDestination('person-1', '/')).resolves.toBe('/register')
    expect(findUnique).toHaveBeenCalledWith({
      where: { personId: 'person-1' },
      select: { id: true },
    })
  })

  it('returns a voter with a submitted registration to the home page', async () => {
    findUnique.mockResolvedValueOnce({ id: 'registration-1' })
    await expect(getSignInDestination('person-1', '/')).resolves.toBe('/')
  })

  it('honors a return to registration without another lookup', async () => {
    await expect(getSignInDestination('person-1', '/register')).resolves.toBe('/register')
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('uses registration’s retry state if the lookup fails', async () => {
    findUnique.mockRejectedValueOnce(new Error('Lookup failed'))
    await expect(getSignInDestination('person-1', '/')).resolves.toBe('/register')
  })
})
