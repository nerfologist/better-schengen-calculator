import type { DayNum } from '../../domain/dates'
import type { DayRange } from '../../domain/types'
import { formatDay } from '../../ui/format'

export interface DayCellProps {
  day: DayNum
  merged: DayRange[]
  window: DayRange
  todayNum: DayNum
  preview: DayRange | null
}

function inRange(day: DayNum, r: DayRange): boolean {
  return r.start <= day && day <= r.end
}

export function DayCell({ day, merged, window, todayNum, preview }: DayCellProps) {
  const presence = merged.some((r) => inRange(day, r))
  const inWindow = inRange(day, window)

  const classes = ['day']
  if (presence) classes.push(inWindow ? 'day--stay' : 'day--stay-out')
  if (day === window.start) classes.push('day--wstart')
  if (day === todayNum) classes.push('day--today')
  if (preview && inRange(day, preview)) classes.push('day--preview')

  const dayOfMonth = new Date(day * 86_400_000).getUTCDate()
  const title = presence ? `${formatDay(day)}: in Schengen` : formatDay(day)

  return (
    <span className={classes.join(' ')} title={title} data-day={day}>
      {dayOfMonth}
    </span>
  )
}
