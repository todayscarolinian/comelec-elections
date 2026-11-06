// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { GET, POST } from '@/app/api/trpc/[trpc]/route'

const BASE = 'http://localhost:3000/api/trpc'

describe('/api/trpc route handler', () => {
  it('rejects a POST from a foreign Origin with 403', async () => {
    const res = await POST(
      new Request(`${BASE}/health.ping`, {
        method: 'POST',
        headers: { origin: 'https://evil.test', 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    expect(res.status).toBe(403)
  })

  it('serves a GET query', async () => {
    const res = await GET(new Request(`${BASE}/health.ping`))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ result: { data: { json: { ok: true } } } })
  })
})
