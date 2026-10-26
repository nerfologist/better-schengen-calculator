import type { DayNum } from '../../domain/dates'
import type { DayRange } from '../../domain/types'
import { formatDay, formatMonth } from '../../ui/format'
import { DayCell } from './DayCell'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export interface MonthGridProps {
  year: number
  month0: number
  merged: DayRange[]
  window: DayRange
  todayNum: DayNum
  preview: DayRange | null
  pendingStart: DayNum | null
  onTap: (day: DayNum) => void
}

const MS_PER_DAY = 86_400_000

function inRange(day: DayNum, range: DayRange): boolean {
  return range.start <= day && day <= range.end
}

export function MonthGrid({
  year,
  month0,
  merged,
  window,
  todayNum,
  preview,
  pendingStart,
  onTap,
}: MonthGridProps) {
  const firstDay = Date.UTC(year, month0, 1) / MS_PER_DAY
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  // Monday-first column offset; 1970-01-01 (day 0) was a Thursday.
  const offset = (firstDay + 3) % 7

  const cells: (DayNum | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => firstDay + i),
  ]

  return (
    <div className="month">
      <h3 className="month-name">{formatMonth(year, month0)}</h3>
      <div className="month-grid">
        {WEEKDAYS.map((w, i) => (
          <span key={`h${i}`} className="weekday" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((day, i) =>
          day === null ? (
            <span key={`b${i}`} />
          ) : (
            <DayCell
              key={day}
              day={day}
              dayOfMonth={i - offset + 1}
              label={formatDay(day)}
              hasPresence={merged.some((r) => inRange(day, r))}
              inWindow={inRange(day, window)}
              isPlanned={day > todayNum}
              isToday={day === todayNum}
              isWindowStart={day === window.start}
              isPreview={preview !== null && inRange(day, preview)}
              isPending={day === pendingStart}
              onTap={onTap}
            />
          ),
        )}
      </div>
    </div>
  )
}
