import { toDayNum, toIso } from '../../domain/dates'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { MonthGrid } from './MonthGrid'

const MONTHS_BACK = 6
const MONTHS_FORWARD = 1
const MAX_MONTHS_FORWARD = 12

/** Year*12 + month index, for month arithmetic. */
function monthIndexOf(day: number): number {
  const [y, m] = toIso(day).split('-').map(Number)
  return y * 12 + (m - 1)
}

export interface TimelineProps {
  /** Range being previewed by a planning tool, if any. */
  preview: DayRange | null
}

export function Timeline({ preview }: TimelineProps) {
  const { mergedRanges, summary, today } = useStays()
  const todayNum = toDayNum(today)

  const [y, m] = today.split('-').map(Number)
  const todayIdx = y * 12 + (m - 1)

  // Extend forward past the default when a previewed trip or a recorded
  // future stay would otherwise fall off the end (capped to a year ahead).
  const lastRelevant = Math.max(
    preview?.end ?? 0,
    mergedRanges.length > 0 ? mergedRanges[mergedRanges.length - 1].end : 0,
  )
  const endIdx = Math.min(
    Math.max(todayIdx + MONTHS_FORWARD, lastRelevant > 0 ? monthIndexOf(lastRelevant) : 0),
    todayIdx + MAX_MONTHS_FORWARD,
  )

  const months: { year: number; month0: number }[] = []
  for (let idx = todayIdx - MONTHS_BACK; idx <= endIdx; idx++) {
    months.push({ year: Math.floor(idx / 12), month0: idx % 12 })
  }

  return (
    <section aria-label="Timeline">
      <div className="timeline">
        {months.map(({ year, month0 }) => (
          <MonthGrid
            key={`${year}-${month0}`}
            year={year}
            month0={month0}
            merged={mergedRanges}
            window={summary.window}
            todayNum={todayNum}
            preview={preview}
          />
        ))}
      </div>
      <ul className="legend">
        <li>
          <i className="day-swatch day--stay" /> In Schengen (counts)
        </li>
        <li>
          <i className="day-swatch day--stay-out" /> In Schengen (outside window)
        </li>
        <li>
          <i className="day-swatch day--wstart" /> Window start
        </li>
        <li>
          <i className="day-swatch day--today" /> Today
        </li>
        <li>
          <i className="day-swatch day--preview" /> Planned trip preview
        </li>
      </ul>
    </section>
  )
}
