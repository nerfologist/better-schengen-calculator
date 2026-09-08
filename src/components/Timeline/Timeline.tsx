import { useCallback, useEffect, useState } from 'react'
import { toDayNum, toIso, type DayNum } from '../../domain/dates'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { formatDay } from '../../ui/format'
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
  const { mergedRanges, summary, today, dispatch } = useStays()
  const todayNum = toDayNum(today)
  const previewEnd = preview?.end

  // Tap-to-add: first tap picks one end of the stay, second tap completes it.
  const [pendingStart, setPendingStart] = useState<DayNum | null>(null)
  const onTap = useCallback(
    (day: DayNum) => {
      if (pendingStart === null) {
        setPendingStart(day)
        return
      }
      const start = Math.min(pendingStart, day)
      const end = Math.max(pendingStart, day)
      const days = end - start + 1
      const kind = start > todayNum ? 'planned stay' : 'stay'
      const confirmed = window.confirm(
        `Add a ${kind} from ${formatDay(start)} to ${formatDay(end)} (${days} ${days === 1 ? 'day' : 'days'})?`,
      )
      if (confirmed) {
        dispatch({ type: 'add', stay: { entry: toIso(start), exit: toIso(end) } })
      }
      setPendingStart(null)
    },
    [pendingStart, todayNum, dispatch],
  )

  useEffect(() => {
    if (pendingStart === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingStart(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingStart])

  // When a planning tool produces a result, bring its exit date into view.
  useEffect(() => {
    if (previewEnd === undefined) return
    const cell = document.querySelector(`[data-day="${previewEnd}"]`)
    if (!cell) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cell.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }, [previewEnd])

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
      {pendingStart === null ? (
        <p className="timeline-tip muted">Tip: tap a day to start adding a stay.</p>
      ) : (
        <p className="timeline-hint" role="status">
          <span>
            Adding a {pendingStart > todayNum ? 'planned stay' : 'stay'} starting{' '}
            <strong>{formatDay(pendingStart)}</strong>: now tap the last day (the same
            day works for a 1-day stay).
          </span>
          <button type="button" className="btn btn-small" onClick={() => setPendingStart(null)}>
            Cancel
          </button>
        </p>
      )}
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
            pendingStart={pendingStart}
            onTap={onTap}
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
          <i className="day-swatch day--planned" /> Planned stay (booked)
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
