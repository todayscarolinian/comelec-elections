// src/server/trpc/__tests__/route-origin.test.ts
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ default: {} })) // don't build a real DB client
vi.mock('@/server/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('@/server/storage', () => ({ getSupabaseAdmin: vi.fn() }))

import { POST } from '../../../../app/api/trpc/[trpc]/route'

const APP = 'https://vote.example.org'

function post(origin?: string) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (origin) headers.set('origin', origin)
  return new Request(`${APP}/api/trpc/health.ping`, { method: 'POST', headers, body: '{}' })
}

describe('tRPC route handler: Origin check on mutations', () => {
  it('rejects a POST from a foreign Origin with 403', async () => {
    vi.stubEnv('AUTH_URL', APP)
    const res = await POST(post('https://evil.test'))
    expect(res.status).toBe(403)
  })

  it('rejects a POST with no Origin with 403', async () => {
    vi.stubEnv('AUTH_URL', APP)
    const res = await POST(post())
    expect(res.status).toBe(403)
  })

  it('lets a POST from the app Origin through to tRPC (not 403)', async () => {
    vi.stubEnv('AUTH_URL', APP)
    const res = await POST(post(APP))
    expect(res.status).not.toBe(403)
  })
})
