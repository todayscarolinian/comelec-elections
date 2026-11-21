// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { upsertPerson } from '../person'

const { upsert } = vi.hoisted(() => ({ upsert: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({ default: { person: { upsert } } }))

beforeEach(() => {
  upsert.mockReset()
  upsert.mockResolvedValue({ id: 'db-person-id', email: 'member@example.com' })
})

describe('upsertPerson', () => {
  it('stores a normalized email and the cleaned Google name', async () => {
    await upsertPerson(' Member@Example.com ', '  Juan   Dela\tCruz  ')
    expect(upsert).toHaveBeenCalledExactlyOnceWith({
      where: { email: 'member@example.com' },
      create: { email: 'member@example.com', name: 'Juan Dela Cruz' },
      update: { name: 'Juan Dela Cruz' },
      select: { id: true, email: true },
    })
  })

  it.each([undefined, null, '', '   '])(
    'falls back to the email for a new Person and keeps an existing name: %j',
    async (name) => {
      await upsertPerson('member@example.com', name)
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { email: 'member@example.com', name: 'member@example.com' },
          update: {},
        }),
      )
    },
  )

  it('caps very long names', async () => {
    await upsertPerson('member@example.com', 'a'.repeat(500))
    const [{ create, update }] = upsert.mock.calls[0]
    expect(create.name).toHaveLength(200)
    expect(update.name).toHaveLength(200)
  })

  it('does not leave trailing whitespace after capping', async () => {
    await upsertPerson('member@example.com', `${'a'.repeat(199)} b`)
    const [{ create }] = upsert.mock.calls[0]
    expect(create.name).toBe('a'.repeat(199))
  })

  it('returns the stored Person', async () => {
    await expect(upsertPerson('member@example.com', 'Member')).resolves.toEqual({
      id: 'db-person-id',
      email: 'member@example.com',
    })
  })
})
