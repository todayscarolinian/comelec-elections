// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { createCallerFactory, type Db, type Session } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { notificationRouter } from '../router'

const createCaller = createCallerFactory(notificationRouter)
const personId = 'person-1'
const signedUpAt = new Date('2026-11-10T00:00:00Z')
const session: NonNullable<Session> = { user: { personId, email: 'voter@example.org' } }
const ownId = '4a1d3c6e-8b2f-4f5a-9c7d-1e2f3a4b5c6d'
const broadcastId = '5b2e4d7f-9c3a-4a6b-8d8e-2f3a4b5c6d7e'
const oldBroadcastId = '6c3f5e8a-ad4b-4b7c-9e9f-3a4b5c6d7e8f'

type Row = {
  id: string
  personId: string | null
  type: string
  data: unknown
  createdAt: Date
  reads: { readAt: Date }[]
}

function setup({
  currentSession = session as Session,
  rows = [] as Row[],
  unreadCount = 0,
  visibleIds = [] as string[],
} = {}) {
  const db = {
    person: {
      findUnique: vi.fn(async () => ({
        id: personId,
        email: 'voter@example.org',
        name: 'V',
        createdAt: signedUpAt,
      })),
    },
    notification: {
      findMany: vi.fn(async (args: { select: Record<string, unknown> }) =>
        'reads' in args.select ? rows : visibleIds.map((id) => ({ id })),
      ),
      count: vi.fn(async () => unreadCount),
    },
    notificationRead: {
      createMany: vi.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length })),
    },
    $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  }
  return {
    db,
    caller: createCaller(makeCtx({ session: currentSession, db: db as unknown as Db })),
  }
}

const visible = { OR: [{ personId }, { personId: null }] }
const unread = {
  reads: { none: { personId } },
  OR: [{ personId }, { personId: null, createdAt: { gte: signedUpAt } }],
}

describe('notification permissions', () => {
  it('rejects signed-out callers without querying', async () => {
    const { caller, db } = setup({ currentSession: null })
    await expect(caller.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(caller.markRead({ ids: [ownId] })).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(caller.markAllRead()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(db.notification.findMany).not.toHaveBeenCalled()
    expect(db.notificationRead.createMany).not.toHaveBeenCalled()
  })
})

describe('notification.list', () => {
  it('queries only own notifications and broadcasts, newest first, with the limit', async () => {
    const { caller, db } = setup()
    await caller.list({ limit: 5 })
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: visible,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 5,
      }),
    )
    // Only this Person's receipts are loaded.
    const [args] = db.notification.findMany.mock.calls[0]
    expect(args.select.reads).toMatchObject({ where: { personId } })
    expect(db.notification.count).toHaveBeenCalledWith({ where: unread })
  })

  it('defaults the limit to 20', async () => {
    const { caller, db } = setup()
    await caller.list()
    expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }))
  })

  it('maps read state and strips personId', async () => {
    const { caller } = setup({
      unreadCount: 1,
      rows: [
        {
          id: ownId,
          personId,
          type: 'REGISTRATION_REJECTED',
          data: { rejectionReason: 'Blurry' },
          createdAt: new Date('2026-11-20T00:00:00Z'),
          reads: [],
        },
        {
          id: broadcastId,
          personId: null,
          type: 'VOTING_OPENED',
          data: null,
          createdAt: new Date('2026-11-21T00:00:00Z'),
          reads: [{ readAt: new Date() }],
        },
        {
          id: oldBroadcastId,
          personId: null,
          type: 'REGISTRATION_OPENED',
          data: null,
          createdAt: new Date('2026-11-01T00:00:00Z'),
          reads: [],
        },
      ],
    })
    const result = await caller.list()
    expect(result.unreadCount).toBe(1)
    expect(result.items.map(({ id, read }) => [id, read])).toEqual([
      [ownId, false],
      [broadcastId, true],
      // A broadcast from before sign-up shows as already read.
      [oldBroadcastId, true],
    ])
    expect(result.items[0].data).toEqual({ rejectionReason: 'Blurry' })
    for (const item of result.items) expect(item).not.toHaveProperty('personId')
  })

  it('returns null data when the stored JSON does not match the schema', async () => {
    const { caller } = setup({
      rows: [
        {
          id: ownId,
          personId,
          type: 'BALLOT_RECORDED',
          data: { held: 'yes' },
          createdAt: new Date(),
          reads: [],
        },
      ],
    })
    const [item] = (await caller.list()).items
    expect(item.data).toBeNull()
  })

  it.each([0, 51])('rejects limit %s', async (limit) => {
    const { caller, db } = setup()
    await expect(caller.list({ limit })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(db.notification.findMany).not.toHaveBeenCalled()
  })
})

describe('notification.markRead', () => {
  it('writes receipts only for ids visible to this Person, idempotently', async () => {
    const { caller, db } = setup({ visibleIds: [ownId] })
    await expect(caller.markRead({ ids: [ownId, broadcastId] })).resolves.toEqual({ count: 1 })
    expect(db.notification.findMany).toHaveBeenCalledWith({
      where: { AND: [{ id: { in: [ownId, broadcastId] } }, visible] },
      select: { id: true },
    })
    expect(db.notificationRead.createMany).toHaveBeenCalledExactlyOnceWith({
      data: [{ notificationId: ownId, personId }],
      skipDuplicates: true,
    })
  })

  it('writes nothing when no ids are visible', async () => {
    const { caller, db } = setup({ visibleIds: [] })
    await expect(caller.markRead({ ids: [ownId] })).resolves.toEqual({ count: 0 })
    expect(db.notificationRead.createMany).not.toHaveBeenCalled()
  })

  it.each([[[]], [['not-a-uuid']], [Array.from({ length: 51 }, () => ownId)]])(
    'rejects invalid ids %#',
    async (ids) => {
      const { caller, db } = setup()
      await expect(caller.markRead({ ids })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expect(db.notification.findMany).not.toHaveBeenCalled()
    },
  )
})

describe('notification.markAllRead', () => {
  it('writes receipts for every unread notification', async () => {
    const { caller, db } = setup({ visibleIds: [ownId, broadcastId] })
    await expect(caller.markAllRead()).resolves.toEqual({ count: 2 })
    expect(db.notification.findMany).toHaveBeenCalledWith({ where: unread, select: { id: true } })
    expect(db.notificationRead.createMany).toHaveBeenCalledExactlyOnceWith({
      data: [
        { notificationId: ownId, personId },
        { notificationId: broadcastId, personId },
      ],
      skipDuplicates: true,
    })
  })
})
