import { useEffect, useMemo, useState } from 'react'
import { isValidIso, toDayNum } from '../../domain/dates'
import { latestExit } from '../../domain/schengen'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { formatDay } from '../../ui/format'

export interface MaxStayToolProps {
  onPreview: (range: DayRange | null) => void
}

export function MaxStayTool({ onPreview }: MaxStayToolProps) {
  const { mergedRanges, today } = useStays()
  const [entry, setEntry] = useState('')

  const result = useMemo(
    () => (isValidIso(entry) ? latestExit(mergedRanges, toDayNum(entry)) : null),
    [mergedRanges, entry],
  )

  useEffect(() => {
    onPreview(
      result?.ok ? { start: toDayNum(entry), end: result.exitDay } : null,
    )
    return () => onPreview(null)
  }, [result, entry, onPreview])

  return (
    <details className="tool">
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
