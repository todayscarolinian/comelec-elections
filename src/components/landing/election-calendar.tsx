'use client'

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

  return (
    <section id="calendar" className="landing-calendar" aria-labelledby="calendar-heading">
      <div className="landing-section-inner landing-calendar-layout">
        <div className="landing-calendar-intro">
          <h2 id="calendar-heading">
            Election
            <br /> Calendar
          </h2>
          <p>
            Registration opens November 15. Voting is scheduled for November 20, from 8 AM to 5 PM
            Philippine time, and may be extended.
          </p>
          <p>Check back for updates from the Commission.</p>
        </div>
        <div className="landing-calendar-panel">
          <div className="landing-month-bar">
            <h3 aria-live="polite">
              {month.name} {year}
            </h3>
            <div>
              <button
                type="button"
                aria-label="Previous month"
                disabled={monthIndex === 0}
                onClick={() => setMonthIndex(0)}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next month"
                disabled={monthIndex === months.length - 1}
                onClick={() => setMonthIndex(1)}
              >
                ›
              </button>
            </div>
          </div>
          <table aria-label={`${month.name} ${year} election calendar`}>
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th key={day} scope="col">
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
                    const event = monthIndex === 0 ? novemberEvents[date] : undefined
                    return (
                      <td key={day} className={event ? 'landing-event' : undefined}>
                        <span>{date}</span>
                        {event && <small>{event}</small>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {monthIndex === 1 && (
            <p className="landing-calendar-note">No December dates have been announced.</p>
          )}
        </div>
      </div>
    </section>
  )
}
