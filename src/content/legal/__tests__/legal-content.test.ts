import { describe, expect, it } from 'vitest'
import { PRIVACY_POLICY } from '../privacy'
import { TERMS_OF_SERVICE } from '../terms'
import { contactInstruction } from '../types'

const documents = [
  ['privacy', PRIVACY_POLICY],
  ['terms', TERMS_OF_SERVICE],
] as const

describe.each(documents)('%s content', (_name, content) => {
  it('uses unique, URL-safe section ids', () => {
    const ids = content.sections.map(({ id }) => id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
  })

  it('has a valid last-updated date', () => {
    expect(content.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(Number.isNaN(Date.parse(content.lastUpdated))).toBe(false)
  })

  it('has no empty sections or list items', () => {
    for (const { body } of content.sections) {
      expect(body.length).toBeGreaterThan(0)
      for (const block of body) {
        const texts = typeof block === 'string' ? [block] : block.items
        for (const text of texts) expect(text.trim()).not.toBe('')
      }
    }
  })

  it('ends with a contact section', () => {
    expect(content.sections.at(-1)?.id).toBe('contact')
  })
})

describe('contact instruction', () => {
  it('points to official channels until an email is confirmed', () => {
    expect(contactInstruction(null)).toContain('official student council channels')
  })

  it('uses the confirmed email when there is one', () => {
    expect(contactInstruction('comelec@example.org')).toBe(
      'Email the SSC COMELEC at comelec@example.org.',
    )
  })
})
