import { describe, expect, it } from 'vitest'
import { safeReferrer, trackablePath } from '../paths'

describe('trackablePath', () => {
  it('keeps public paths', () => {
    expect(trackablePath('/')).toBe('/')
    expect(trackablePath('/candidates/dyane-jhen-wagas')).toBe('/candidates/dyane-jhen-wagas')
  })

  it('drops query strings and hashes', () => {
    expect(trackablePath('/candidates?q=gavas&party=Tingog')).toBe('/candidates')
    expect(trackablePath('/privacy#cookies')).toBe('/privacy')
    expect(trackablePath('?q=x')).toBe('/')
  })

  it('never tracks the admin area', () => {
    expect(trackablePath('/admin')).toBeNull()
    expect(trackablePath('/admin/ballots')).toBeNull()
    expect(trackablePath('/admin?tab=x')).toBeNull()
  })

  it('does not treat lookalike paths as admin', () => {
    expect(trackablePath('/administration')).toBe('/administration')
  })
})

describe('safeReferrer', () => {
  const origin = 'https://vote.example.org'

  it('strips the query string from same-site referrers', () => {
    expect(safeReferrer(`${origin}/candidates?q=gavas`, origin)).toBe(`${origin}/candidates`)
  })

  it('hides same-site admin referrers', () => {
    expect(safeReferrer(`${origin}/admin/ballots`, origin)).toBe('')
  })

  it('keeps only the origin of other sites', () => {
    expect(safeReferrer('https://www.facebook.com/groups/123?ref=share', origin)).toBe(
      'https://www.facebook.com',
    )
  })

  it('returns an empty string for missing or invalid referrers', () => {
    expect(safeReferrer('', origin)).toBe('')
    expect(safeReferrer('not a url', origin)).toBe('')
  })
})
