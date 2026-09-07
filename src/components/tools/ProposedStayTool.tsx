import { useEffect, useMemo, useState } from 'react'
import { isValidIso, toDayNum } from '../../domain/dates'
import { checkStay } from '../../domain/schengen'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { formatDay } from '../../ui/format'

export interface ProposedStayToolProps {
  onPreview: (range: DayRange | null) => void
}

export function ProposedStayTool({ onPreview }: ProposedStayToolProps) {
  const { mergedRanges } = useStays()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const range = useMemo<DayRange | null>(() => {
    if (!isValidIso(start) || !isValidIso(end)) return null
    const r = { start: toDayNum(start), end: toDayNum(end) }
    return r.end >= r.start ? r : null
  }, [start, end])

  const result = useMemo(
    () => (range ? checkStay(mergedRanges, range.start, range.end) : null),
    [mergedRanges, range],
  )

  useEffect(() => {
    onPreview(range)
    return () => onPreview(null)
  }, [range, onPreview])

  return (
    <details className="tool">
      <summary>Would this trip be OK?</summary>
      <div className="tool-body">
        <div className="tool-fields">
          <label>
            Entry
            <input
              type="date"
              max={end || undefined}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            Exit
            <input
              type="date"
              min={start || undefined}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          {(start !== '' || end !== '') && (
            <button
              type="button"
              className="btn tool-clear"
              onClick={() => {
                setStart('')
                setEnd('')
              }}
            >
              Clear
            </button>
          )}
        </div>
        {range && result?.compliant && (
          <p className="tool-result is-ok" role="status">
            <strong>Compliant.</strong> This trip peaks at{' '}
            <strong>{result.peakUsage}/90</strong> days used.
          </p>
        )}
        {range && result && !result.compliant && (
          <p className="tool-result is-bad" role="status">
            <strong>Not compliant.</strong> The rule breaks on{' '}
            <strong>{formatDay(result.firstViolation)}</strong> ({result.overshoot}{' '}
            {result.overshoot === 1 ? 'day' : 'days'} over).
            {result.latestCompliantExit !== null ? (
              <>
                {' '}
                Latest compliant exit: <strong>{formatDay(result.latestCompliantExit)}</strong>.
              </>
            ) : (
              <> No stay is allowed starting on this date.</>
            )}
          </p>
        )}
      </div>
    </details>
  )
}
