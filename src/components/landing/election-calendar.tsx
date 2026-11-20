'use client'

import { displayHeading, sectionAnchor, sectionInner } from './landing-styles'
import { useState } from 'react'

const year = 2026
const months = [
  { name: 'November', firstDay: 0, days: 30 },
  { name: 'December', firstDay: 2, days: 31 },
] as const
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const novemberEvents: Readonly<Record<number, string>> = {
  15: 'Registration opens',
  20: 'Election Day',
}

export function ElectionCalendar() {
  const [monthIndex, setMonthIndex] = useState<0 | 1>(0)
  const month = months[monthIndex]
  const weeks = Math.ceil((month.firstDay + month.days) / 7)
  const isNovember = monthIndex === 0

  return (
    <section
      id="calendar"
      className={`${sectionAnchor} bg-[#d8e9bd] bg-[url('/landing/calendar.webp')] bg-position-[73.73%_90.78%] bg-size-[137.88%_109%]`}
      aria-labelledby="calendar-heading"
    >
      <div
        className={`${sectionInner} grid content-center items-start gap-8 pt-12 pb-12 min-[52.01rem]:min-h-[min(56vw,50rem)] min-[52.01rem]:grid-cols-[minmax(0,1fr)_minmax(0,1.215fr)] min-[52.01rem]:pt-[clamp(5rem,8.6vw,7.75rem)] min-[52.01rem]:pb-[clamp(3rem,5vw,4.5rem)]`}
      >
        <div className="max-w-[24.5rem] text-[clamp(1rem,1.4vw,1.25rem)] leading-[1.4] [&>p+p]:mt-8">
          <h2
            id="calendar-heading"
            className={`${displayHeading} mb-8 text-[clamp(2.5rem,5.83vw,5.25rem)] leading-[1.165]`}
          >
            Election
            <br /> Calendar
          </h2>
          <p>
            Key election dates are highlighted for you. Switch between November and December so you
            never miss what matters most.
          </p>
          <p>Dates are added as they’re confirmed, so check back often.</p>
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between pb-5">
            <div className="flex items-center gap-2">
              <h3
                className="text-[clamp(1.25rem,1.87vw,1.7rem)] italic underline underline-offset-4 [font-family:var(--landing-display),Georgia,serif]"
                aria-live="polite"
              >
                {month.name}
              </h3>
              <button
                type="button"
                className="min-h-11 min-w-11 cursor-pointer text-[1.6rem] hover:bg-(--landing-cream)/55"
                aria-label={isNovember ? 'Next month' : 'Previous month'}
                onClick={() => setMonthIndex(isNovember ? 1 : 0)}
              >
                {isNovember ? '›' : '‹'}
              </button>
            </div>
            <span className="text-[clamp(1.25rem,1.87vw,1.7rem)] italic [font-family:var(--landing-fraunces),Georgia,serif]">
              {year}
            </span>
          </div>
          <table
            className="w-full table-fixed border-none"
            aria-label={`${month.name} ${year} election calendar`}
          >
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    className="pb-3 ps-[clamp(0.2rem,0.77vw,0.7rem)] text-start text-[clamp(0.6rem,0.73vw,0.66rem)] font-medium uppercase"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: weeks }, (_, week) => (
                <tr key={week}>
                  {weekdays.map((day, column) => {
                    const date = week * 7 + column - month.firstDay + 1
                    if (date < 1 || date > month.days) return <td key={day} aria-hidden="true" />
                    const event = isNovember ? novemberEvents[date] : undefined
                    return (
                      <td key={day}>
                        <div
                          data-calendar-day={date}
                          className={`flex aspect-square flex-col justify-between p-[clamp(0.2rem,0.77vw,0.7rem)] text-[clamp(0.65rem,0.98vw,0.875rem)] leading-none ${event ? 'bg-(--landing-green) text-(--landing-cream) forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:[forced-color-adjust:none]' : ''}`}
                        >
                          <span>{date}</span>
                          {event && (
                            <small className="text-[clamp(0.58rem,0.85vw,0.7rem)] leading-tight max-[38rem]:sr-only">
                              {event}
                            </small>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {isNovember && (
            <ul className="mt-3 hidden text-xs max-[38rem]:block">
              {Object.entries(novemberEvents).map(([date, event]) => (
                <li key={date}>
                  Nov {date} · {event}
                </li>
              ))}
            </ul>
          )}
          {isNovember ? (
            <p className="sr-only">
              Voting is scheduled for November 20, from 8 AM to 5 PM Philippine time, and may be
              extended.
            </p>
          ) : (
            <p className="mt-3 text-sm">No December dates have been announced.</p>
          )}
        </div>
      </div>
    </section>
  )
}
