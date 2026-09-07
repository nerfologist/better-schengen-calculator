import { toDayNum } from '../../domain/dates'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { MonthGrid } from './MonthGrid'

const MONTHS_BACK = 6
const MONTHS_FORWARD = 1

export interface TimelineProps {
  /** Range being previewed by a planning tool, if any. */
  preview: DayRange | null
}

export function Timeline({ preview }: TimelineProps) {
  const { mergedRanges, summary, today } = useStays()
  const todayNum = toDayNum(today)

  const [y, m] = today.split('-').map(Number)
  const months: { year: number; month0: number }[] = []
  for (let i = -MONTHS_BACK; i <= MONTHS_FORWARD; i++) {
    const date = new Date(Date.UTC(y, m - 1 + i, 1))
    months.push({ year: date.getUTCFullYear(), month0: date.getUTCMonth() })
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
