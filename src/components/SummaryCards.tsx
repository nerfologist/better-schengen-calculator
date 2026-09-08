import { toDayNum } from '../domain/dates'
import { useStays } from '../state/StaysContext'
import { formatDay, formatDayShort } from '../ui/format'
import type { PlanRecap } from './tools/recap'

export interface SummaryCardsProps {
  recap: PlanRecap | null
}

export function SummaryCards({ recap }: SummaryCardsProps) {
  const { summary, mergedRanges, today } = useStays()
  const { used, remaining, window, latestExitIfEnteringToday } = summary
  const todayNum = toDayNum(today)
  const plannedDays = mergedRanges.reduce(
    (sum, r) => sum + Math.max(0, r.end - Math.max(r.start, todayNum + 1) + 1),
    0,
  )

  return (
    <section className="cards" aria-label="Summary">
      <div className="card">
        <span className="card-value">{used}</span>
        <span className="card-label">
          days used in the last 180
          {plannedDays > 0 ? `, plus ${plannedDays} booked ahead` : ''}
        </span>
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
      {recap && (
        <div className={`plan-recap ${recap.ok ? 'is-ok' : 'is-bad'}`} role="status">
          <span className="plan-recap-tag">Trip check</span>
          <span>{recap.text}</span>
        </div>
      )}
    </section>
  )
}
