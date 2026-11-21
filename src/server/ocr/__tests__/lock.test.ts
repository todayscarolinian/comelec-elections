// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { withOcrLock } from '../lock'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('withOcrLock', () => {
  it('runs one job at a time in the order they arrive', async () => {
    const first = deferred()
    const second = deferred()
    const order: string[] = []
    let running = 0
    let maxRunning = 0

    const job = (name: string, gate: Promise<void>) => async () => {
      running++
      maxRunning = Math.max(maxRunning, running)
      order.push(`start ${name}`)
      await gate
      order.push(`end ${name}`)
      running--
      return name
    }

    const a = withOcrLock(job('a', first.promise))
    const b = withOcrLock(job('b', second.promise))
    await Promise.resolve()
    second.resolve()
    first.resolve()

    await expect(Promise.all([a, b])).resolves.toEqual(['a', 'b'])
    expect(maxRunning).toBe(1)
    expect(order).toEqual(['start a', 'end a', 'start b', 'end b'])
  })

  it('runs the next job after a failed one', async () => {
    const failing = withOcrLock(() => Promise.reject(new Error('OCR failed')))
    const next = withOcrLock(() => Promise.resolve('ok'))

    await expect(failing).rejects.toThrow('OCR failed')
    await expect(next).resolves.toBe('ok')
  })
})
