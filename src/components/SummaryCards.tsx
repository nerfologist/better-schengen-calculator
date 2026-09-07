import { useStays } from '../state/StaysContext'
import { formatDay, formatDayShort } from '../ui/format'

export function SummaryCards() {
  const { summary } = useStays()
  const { used, remaining, window, latestExitIfEnteringToday } = summary

  return (
    <section className="cards" aria-label="Summary">
      <div className="card">
        <span className="card-value">{used}</span>
        <span className="card-label">days used in the last 180</span>
      </div>
      <div className="card">
        <span className={`card-value ${remaining === 0 ? 'is-danger' : ''}`}>
          {remaining}
        </span>
        <span className="card-label">days available today</span>
      </div>
      <div className="card">
        <span className="card-value card-value-small">
          {formatDayShort(window.start)}
        </span>
        <span className="card-label">180-day window opened</span>
      </div>
      <div className="card">
        <span className="card-value card-value-small">
          {latestExitIfEnteringToday !== null
            ? formatDay(latestExitIfEnteringToday)
            : 'Not allowed'}
        </span>
        <span className="card-label">latest exit if you enter today</span>
      </div>
    </section>
  )
}
