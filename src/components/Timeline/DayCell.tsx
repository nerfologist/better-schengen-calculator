import { memo } from 'react'
import type { DayNum } from '../../domain/dates'

export interface DayCellProps {
  day: DayNum
  dayOfMonth: number
  label: string
  hasPresence: boolean
  inWindow: boolean
  isPlanned: boolean
  isToday: boolean
  isWindowStart: boolean
  isPreview: boolean
  isPending: boolean
  isSelecting: boolean
  onTap: (day: DayNum) => void
}

/**
 * Memoized so changing the preview or the pending selection only re-renders
 * the few cells whose flags actually change, not every day on screen.
 */
export const DayCell = memo(function DayCell({
  day,
  dayOfMonth,
  label,
  hasPresence,
  inWindow,
  isPlanned,
  isToday,
  isWindowStart,
  isPreview,
  isPending,
  isSelecting,
  onTap,
}: DayCellProps) {
  const classes = ['day']
  if (hasPresence) {
    // Future presence is a booking, not days already spent.
    classes.push(
      isPlanned ? 'day--planned' : inWindow ? 'day--stay' : 'day--stay-out',
    )
  }
  if (isWindowStart) classes.push('day--wstart')
  if (isToday) classes.push('day--today')
  if (isPreview) classes.push('day--preview')
  if (isPending) classes.push('day--pending')

  const title = hasPresence
    ? `${label}: ${isPlanned ? 'planned stay' : 'in Schengen'}`
    : label

  return (
    <button
      type="button"
      className={classes.join(' ')}
      title={title}
      data-day={day}
      aria-label={
        isSelecting
          ? `${label}: tap to end the stay here`
          : `${label}: tap to start adding a stay`
      }
      onClick={() => onTap(day)}
    >
      {dayOfMonth}
    </button>
  )
})
