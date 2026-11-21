import { electionDay, novemberEvents } from './landing-schedule'
import { displayHeading, sectionAnchor, sectionInner, sectionPadding } from './landing-styles'

const year = 2026
const firstDay = new Date(Date.UTC(year, 10, 1)).getUTCDay()
const days = 30
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weeks = Math.ceil((firstDay + days) / weekdays.length)

export function ElectionCalendar() {
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
          <p>Key election dates are highlighted in the calendar.</p>
          <p>Dates are added as they’re confirmed, so check back often.</p>
        </div>
        <div className="w-full min-w-0 justify-self-end min-[52rem]:max-w-[68rem]">
          <div className="flex items-center justify-between px-[clamp(0.2rem,0.87vw,0.8rem)] pb-5">
            <h3 className="text-[clamp(1.5rem,2.2vw,2rem)] italic underline underline-offset-4 [font-family:var(--landing-display),Georgia,serif]">
              November
            </h3>
            <span className="text-[clamp(1.5rem,2.2vw,2rem)] italic [font-family:var(--landing-fraunces),Georgia,serif]">
              {year}
            </span>
          </div>
          <table
            className="w-full table-fixed border-none"
            aria-label={`November ${year} election calendar`}
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
                    const date = week * weekdays.length + column - firstDay + 1
                    if (date < 1 || date > days) return <td key={day} aria-hidden="true" />
                    const events = novemberEvents.filter(
                      ({ start, end = start }) => date >= start && date <= end,
                    )
                    return (
                      <td key={day}>
                        <div
                          data-calendar-day={date}
                          className={`flex aspect-square flex-col justify-between p-[clamp(0.2rem,0.87vw,0.8rem)] text-[clamp(0.75rem,1.25vw,1.125rem)] leading-none ${events.length ? 'bg-(--landing-green) text-(--landing-cream) forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:[forced-color-adjust:none]' : ''}`}
                        >
                          <span>{date}</span>
                          {events.length > 0 && (
                            <ul className="text-[clamp(0.5rem,2.1vw,0.65rem)] leading-none min-[38rem]:text-[clamp(0.65rem,0.95vw,0.875rem)] min-[38rem]:leading-tight">
                              {events.map(({ title, shortTitle, compactTitle }) => (
                                <li key={title} title={title}>
                                  <span className="sr-only">{title}</span>
                                  <span
                                    aria-hidden="true"
                                    className={compactTitle ? 'hidden min-[64rem]:inline' : ''}
                                  >
                                    {shortTitle}
                                  </span>
                                  {compactTitle && (
                                    <span aria-hidden="true" className="min-[64rem]:hidden">
                                      {compactTitle}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sr-only">
            Voting is scheduled for November {electionDay}, from 8 AM to 5 PM Philippine time, and
            may be extended.
          </p>
        </div>
      </div>
    </section>
  )
}
