// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  releaseResults: vi.fn(),
  listBallots: vi.fn(),
  exportBallots: vi.fn(),
  listAuditLog: vi.fn(),
}))

vi.mock('@/server/storage', () => ({ getSupabaseAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('../services/dashboard', () => ({ getDashboard: services.getDashboard }))
vi.mock('../services/ballotAudit', () => ({
  listBallots: services.listBallots,
  exportBallots: services.exportBallots,
}))
vi.mock('../services/auditLog', () => ({ listAuditLog: services.listAuditLog }))
vi.mock('../services/electionState', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/electionState')>()),
  releaseResults: services.releaseResults,
}))

import { createCallerFactory, type Db } from '@/server/trpc/init'
import { makeCtx } from '@/server/trpc/helpers'
import { adminRouter } from '../router'

const createCaller = createCallerFactory(adminRouter)
const ADMIN = 'chair@example.com'

function callerFor(email: string | null) {
  const db = {
    person: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({ id: where.id })),
    },
    admin: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        where.email === ADMIN ? { email: ADMIN } : null,
      ),
    },
  } as unknown as Db
  return createCaller(
    makeCtx({ session: email ? { user: { personId: `person-${email}`, email } } : null, db }),
  )
}

type Caller = ReturnType<typeof callerFor>
const procedures: [string, (caller: Caller) => Promise<unknown>][] = [
  ['getDashboard', (caller) => caller.getDashboard()],
  ['releaseResults', (caller) => caller.releaseResults()],
  ['listBallots', (caller) => caller.listBallots({})],
  ['exportBallots', (caller) => caller.exportBallots()],
  ['listAuditLog', (caller) => caller.listAuditLog({})],
]

beforeEach(() => {
  for (const service of Object.values(services)) service.mockReset()
})

describe('Admin panel procedures', () => {
  it.each(procedures)('%s rejects signed-out callers', async (_name, call) => {
    await expect(call(callerFor(null))).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    for (const service of Object.values(services)) expect(service).not.toHaveBeenCalled()
  })

  it.each(procedures)('%s rejects signed-in non-Admins', async (_name, call) => {
    await expect(call(callerFor('voter@example.com'))).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    for (const service of Object.values(services)) expect(service).not.toHaveBeenCalled()
  })

  it('releaseResults attributes the release to the calling Admin', async () => {
    const releasedAt = new Date('2026-11-24T10:00:00Z')
    services.releaseResults.mockResolvedValue({ resultsReleasedAt: releasedAt })

    await expect(callerFor(ADMIN).releaseResults()).resolves.toEqual({
      resultsReleasedAt: releasedAt,
    })
    expect(services.releaseResults).toHaveBeenCalledWith(expect.anything(), { adminEmail: ADMIN })
  })

  it('listBallots passes filters and the Admin email to the audited service', async () => {
    services.listBallots.mockResolvedValue({ items: [], nextCursor: null })

    await callerFor(ADMIN).listBallots({ status: 'HELD_PENDING', yearLevel: '2', search: ' ana ' })

    expect(services.listBallots).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'HELD_PENDING', yearLevel: '2', search: 'ana' },
      ADMIN,
    )
  })

  it('listBallots rejects a malformed cursor before reaching the service', async () => {
    await expect(callerFor(ADMIN).listBallots({ cursor: 'not-a-uuid' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(services.listBallots).not.toHaveBeenCalled()
  })

  it('listAuditLog rejects unknown actions', async () => {
    await expect(
      callerFor(ADMIN).listAuditLog({ action: 'DROP_TABLE' as 'VIEW_BALLOTS' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(services.listAuditLog).not.toHaveBeenCalled()
  })
})
