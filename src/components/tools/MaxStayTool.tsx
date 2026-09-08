import { useEffect, useMemo, useState } from 'react'
import { isValidIso, toDayNum } from '../../domain/dates'
import { latestExit } from '../../domain/schengen'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { usePersistedInput } from '../../ui/usePersistedInput'
import { formatDay, formatDayShort } from '../../ui/format'
import type { PlanRecap } from './recap'

export interface MaxStayToolProps {
  onPreview: (range: DayRange | null) => void
  onRecap: (recap: PlanRecap | null) => void
}

export function MaxStayTool({ onPreview, onRecap }: MaxStayToolProps) {
  const { mergedRanges, today } = useStays()
  const [entry, setEntry] = usePersistedInput('schengen-calc:plan.maxEntry')
  // A persisted date means an ongoing calculation: start open so it shows.
  const [open, setOpen] = useState(() => entry !== '')

  const result = useMemo(
    () => (isValidIso(entry) ? latestExit(mergedRanges, toDayNum(entry)) : null),
    [mergedRanges, entry],
  )

  useEffect(() => {
    onPreview(
      result?.ok ? { start: toDayNum(entry), end: result.exitDay } : null,
    )
    if (!result) {
      onRecap(null)
    } else {
      const enterOn = `Enter ${formatDayShort(toDayNum(entry))}`
      if (result.ok) {
        onRecap({
          ok: true,
          text: `${enterOn}: up to ${result.stayLength} days, until ${formatDayShort(result.exitDay)}`,
        })
      } else if (result.reason === 'entry-day-not-compliant') {
        onRecap({ ok: false, text: `${enterOn}: not allowed, ${result.usedOnEntry}/90 days` })
      } else {
        onRecap({
          ok: false,
          text: `${enterOn}: would break your booking on ${formatDayShort(result.conflictDay)}`,
        })
      }
    }
    return () => {
      onPreview(null)
      onRecap(null)
    }
  }, [result, entry, onPreview, onRecap])

  return (
    <details
      className="tool"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>How long can I stay?</summary>
      <div className="tool-body">
        <div className="tool-fields">
          <label>
            Planned entry date
            <input
              type="date"
              min={today}
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
          </label>
          {entry !== '' && (
            <button type="button" className="btn tool-clear" onClick={() => setEntry('')}>
              Clear
            </button>
          )}
        </div>
        {result && result.ok && (
          <p className="tool-result is-ok" role="status">
            You can stay <strong>{result.stayLength} days</strong>, until{' '}
            <strong>{formatDay(result.exitDay)}</strong> (included).
          </p>
        )}
        {result && !result.ok && result.reason === 'entry-day-not-compliant' && (
          <p className="tool-result is-bad" role="status">
            You can't enter on this date: you would be at{' '}
            <strong>{result.usedOnEntry}/90</strong> days.
            {result.earliestEntry !== null && (
              <>
                {' '}
                Earliest compliant entry: <strong>{formatDay(result.earliestEntry)}</strong>.
              </>
            )}
          </p>
        )}
        {result && !result.ok && result.reason === 'conflicts-with-future-stay' && (
          <p className="tool-result is-bad" role="status">
            Entering on this date would push your recorded stay over the limit on{' '}
            <strong>{formatDay(result.conflictDay)}</strong>.
          </p>
        )}
      </div>
    </details>
  )
}
