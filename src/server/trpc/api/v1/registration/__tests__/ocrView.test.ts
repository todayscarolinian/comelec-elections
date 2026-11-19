// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ocrView } from '../core/ocrView'

const now = new Date('2026-11-15T10:00:00.000Z')
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000)

describe('ocrView', () => {
  it('reports PENDING older than 10 minutes as FAILED', () => {
    expect(ocrView({ ocrStatus: 'PENDING', submittedAt: minutesAgo(11) }, now)).toBe('FAILED')
  })

  it('leaves PENDING newer than 10 minutes alone', () => {
    expect(ocrView({ ocrStatus: 'PENDING', submittedAt: minutesAgo(9) }, now)).toBe('PENDING')
  })

  it('leaves PENDING at exactly 10 minutes alone', () => {
    expect(ocrView({ ocrStatus: 'PENDING', submittedAt: minutesAgo(10) }, now)).toBe('PENDING')
  })

  it('leaves DONE alone, however old', () => {
    expect(ocrView({ ocrStatus: 'DONE', submittedAt: minutesAgo(600) }, now)).toBe('DONE')
  })

  it('leaves FAILED alone, however old', () => {
    expect(ocrView({ ocrStatus: 'FAILED', submittedAt: minutesAgo(600) }, now)).toBe('FAILED')
  })
})
