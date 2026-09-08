import type { DayNum } from '../../domain/dates'
import type { DayRange } from '../../domain/types'
import { formatDay } from '../../ui/format'

export interface DayCellProps {
  day: DayNum
  merged: DayRange[]
  window: DayRange
  todayNum: DayNum
  preview: DayRange | null
  pendingStart: DayNum | null
  onTap: (day: DayNum) => void
}

function inRange(day: DayNum, r: DayRange): boolean {
  return r.start <= day && day <= r.end
}

export function DayCell({
  day,
  merged,
  window,
  todayNum,
  preview,
  pendingStart,
  onTap,
}: DayCellProps) {
  const presence = merged.some((r) => inRange(day, r))
  const inWindow = inRange(day, window)

  const classes = ['day']
  if (presence) {
    // Future presence is a booking, not days already spent.
    if (day > todayNum) classes.push('day--planned')
    else classes.push(inWindow ? 'day--stay' : 'day--stay-out')
  }
  if (day === window.start) classes.push('day--wstart')
  if (day === todayNum) classes.push('day--today')
  if (preview && inRange(day, preview)) classes.push('day--preview')
  if (day === pendingStart) classes.push('day--pending')

  const dayOfMonth = new Date(day * 86_400_000).getUTCDate()
  const title = presence
    ? `${formatDay(day)}: ${day > todayNum ? 'planned stay' : 'in Schengen'}`
    : formatDay(day)

  return (
    <button
      type="button"
      className={classes.join(' ')}
      title={title}
      data-day={day}
      aria-label={
        pendingStart !== null ? `${formatDay(day)}: tap to end the stay here` : `${formatDay(day)}: tap to start adding a stay`
      }
      onClick={() => onTap(day)}
    >
      {dayOfMonth}
    </button>
  )
}
