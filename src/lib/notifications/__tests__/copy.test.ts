import { describe, expect, it } from 'vitest'
import { notificationCopy } from '../copy'

describe('REGISTRATION_APPROVED copy', () => {
  it('asks the Voter to cast their Ballot only while voting is open', () => {
    expect(notificationCopy('REGISTRATION_APPROVED', { votingOpen: true })).toEqual({
      title: 'Registration approved',
      body: 'You are now a Voter. Cast your Ballot before voting closes.',
      href: '/ballot',
    })
  })

  it('promises a heads-up and points to the candidates while voting is closed', () => {
    const copy = notificationCopy('REGISTRATION_APPROVED', { votingOpen: false })
    expect(copy.body).not.toMatch(/cast your ballot/i)
    expect(copy.body).toMatch(/notify you the moment voting opens/)
    expect(copy.href).toBe('/candidates')
  })

  it('tells a Voter with a held Ballot that it now counts', () => {
    expect(notificationCopy('REGISTRATION_APPROVED', { held: true, votingOpen: false }).body).toBe(
      'Your held Ballot now counts.',
    )
  })

  it('treats older notices without a snapshot as sent before voting opened', () => {
    expect(notificationCopy('REGISTRATION_APPROVED', null)).toEqual(
      notificationCopy('REGISTRATION_APPROVED', { votingOpen: false }),
    )
  })
})
