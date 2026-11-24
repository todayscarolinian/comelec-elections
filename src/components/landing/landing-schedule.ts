export const electionDay = 24
export const electionOpens = '8 AM'
export const electionCloses = '8:30 PM'

type CalendarEvent = {
  start: number
  end?: number
  title: string
  shortTitle: string
  compactTitle?: string
}

export const novemberEvents: readonly CalendarEvent[] = [
  { start: 22, title: 'PVP Debates and Grand Rally', shortTitle: 'Grand Rally' },
  { start: electionDay, title: 'Election Day', shortTitle: 'Election Day' },
  { start: 25, title: 'Initial results', shortTitle: 'Initial results', compactTitle: 'Results' },
  {
    start: 25,
    end: 28,
    title: 'Protest of post-election results',
    shortTitle: 'Protest period',
    compactTitle: 'Protest',
  },
  {
    start: 29,
    title: 'Release of the official list of duly elected officials',
    shortTitle: 'Official list',
  },
]
