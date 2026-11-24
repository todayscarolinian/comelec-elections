import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CANDIDATES, candidateHref } from '@/lib/candidates'
import { CandidateGallery } from '../candidate-gallery'

it('shuffles the preview when the homepage gallery mounts', async () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0.99)

  try {
    render(<CandidateGallery />)
    const councilors = within(screen.getByRole('region', { name: 'Councilors' }))
    const lastCouncilor = CANDIDATES.filter(({ officeId }) => officeId === 'councilors').at(-1)!

    await waitFor(() =>
      expect(
        councilors.getAllByRole('link', { name: /view profile/i })[0].getAttribute('href'),
      ).toBe(candidateHref(lastCouncilor.id)),
    )
  } finally {
    random.mockRestore()
  }
})

it('shows a different set of councilors on each shuffle and keeps their profiles linked', () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0)

  try {
    render(<CandidateGallery />)
    const councilors = within(screen.getByRole('region', { name: 'Councilors' }))
    const profiles = () =>
      councilors
        .getAllByRole('link', { name: /view profile/i })
        .map((link) => link.getAttribute('href'))
    const initial = profiles()
    const shuffle = screen.getByRole('button', { name: 'Shuffle candidates' })
    expect(shuffle.previousElementSibling).toBe(
      screen.getByRole('link', { name: 'View all candidates' }),
    )

    for (let click = 0; click < 2; click++) {
      const previous = profiles()
      fireEvent.click(shuffle)
      const next = profiles()
      expect(next).toHaveLength(initial.length)
      expect(new Set(next).size).toBe(initial.length)
      expect(next.some((href) => !previous.includes(href))).toBe(true)
    }

    expect(screen.getByRole('heading', { name: 'Gavas, Mark Lawrence L.' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Ungab, Princess Jannah' })).toBeTruthy()
  } finally {
    random.mockRestore()
  }
})
