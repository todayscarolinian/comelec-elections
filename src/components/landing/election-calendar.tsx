'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { displayHeading, sectionAnchor, sectionInner, sectionPadding } from './landing-styles'
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
  const MonthChevron = isNovember ? ChevronRight : ChevronLeft

  return (
    <section
      id="calendar"
      className={`${sectionAnchor} bg-[#d8e9bd] bg-[url('/landing/calendar.webp')] bg-position-[73.73%_90.78%] bg-size-[137.88%_109%]`}
      aria-labelledby="calendar-heading"
    >
      <div
        className={`${sectionInner} ${sectionPadding} grid min-h-svh content-center items-start gap-x-8 gap-y-10 min-[52rem]:grid-cols-[minmax(16rem,min(30%,24.5rem))_minmax(0,1fr)] min-[52rem]:items-center`}
      >
        <div className="max-w-[24.5rem] text-[clamp(1rem,1.4vw,1.25rem)] leading-relaxed [container-type:inline-size] min-[52rem]:pb-[clamp(2rem,8svh,6rem)] [&>p+p]:mt-5">
          <h2
            id="calendar-heading"
            className={`${displayHeading} mb-6 text-[min(25.5cqi,clamp(3rem,7.55vw,6.75rem))] leading-[1.02]`}
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
        <div className="w-full min-w-0 justify-self-end min-[52rem]:max-w-[68rem]">
          <div className="flex items-center justify-between px-[clamp(0.2rem,0.87vw,0.8rem)] pb-5">
            <div className="flex items-center gap-2">
              <h3
                className="text-[clamp(1.5rem,2.2vw,2rem)] italic underline underline-offset-4 [font-family:var(--landing-display),Georgia,serif]"
                aria-live="polite"
              >
                {month.name}
              </h3>
              <button
                type="button"
                className="inline-flex size-11 cursor-pointer items-center justify-center hover:bg-(--landing-cream)/55"
                aria-label={isNovember ? 'Next month' : 'Previous month'}
                onClick={() => setMonthIndex(isNovember ? 1 : 0)}
              >
                <MonthChevron aria-hidden="true" size={20} />
              </button>
            </div>
            <span className="text-[clamp(1.5rem,2.2vw,2rem)] italic [font-family:var(--landing-fraunces),Georgia,serif]">
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
                    className="pb-3 ps-[clamp(0.2rem,0.87vw,0.8rem)] text-start text-[clamp(0.65rem,0.84vw,0.75rem)] font-medium uppercase"
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
                          className={`flex aspect-square flex-col justify-between p-[clamp(0.2rem,0.87vw,0.8rem)] text-[clamp(0.75rem,1.25vw,1.125rem)] leading-none ${event ? 'bg-(--landing-green) text-(--landing-cream) forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:[forced-color-adjust:none]' : ''}`}
                        >
                          <span>{date}</span>
                          {event && (
                            <small className="text-[clamp(0.65rem,0.95vw,0.875rem)] leading-tight max-[38rem]:sr-only">
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
          <div className="mt-3 min-h-10">
            {isNovember ? (
              <>
                <ul className="hidden text-xs max-[38rem]:block">
                  {Object.entries(novemberEvents).map(([date, event]) => (
                    <li key={date}>
                      Nov {date} · {event}
                    </li>
                  ))}
                </ul>
                <p className="sr-only">
                  Voting is scheduled for November 20, from 8 AM to 5 PM Philippine time, and may be
                  extended.
                </p>
              </>
            ) : (
              <p className="text-sm">No December dates have been announced.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
