import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from '../../analytics/goatcounter'
import { isValidIso, toDayNum } from '../../domain/dates'
import { checkStay } from '../../domain/schengen'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { formatDay, formatDayShort } from '../../ui/format'
import { usePersistedInput } from '../../ui/usePersistedInput'
import { CoffeeNudge } from '../CoffeeNudge'
import type { PlanRecap } from './recap'

export interface ProposedStayToolProps {
  onPreview: (range: DayRange | null) => void
  onRecap: (recap: PlanRecap | null) => void
}

export function ProposedStayTool({ onPreview, onRecap }: ProposedStayToolProps) {
  const { mergedRanges } = useStays()
  const [start, setStart] = usePersistedInput('schengen-calc:plan.proposedStart')
  const [end, setEnd] = usePersistedInput('schengen-calc:plan.proposedEnd')
  // Persisted dates mean an ongoing calculation: start open so it shows.
  const [open, setOpen] = useState(() => start !== '' || end !== '')

  const range = useMemo<DayRange | null>(() => {
    if (!isValidIso(start) || !isValidIso(end)) return null
    const r = { start: toDayNum(start), end: toDayNum(end) }
    return r.end >= r.start ? r : null
  }, [start, end])

  const result = useMemo(
    () => (range ? checkStay(mergedRanges, range.start, range.end) : null),
    [mergedRanges, range],
  )

  const usageTracked = useRef(false)
  useEffect(() => {
    if (result && !usageTracked.current) {
      usageTracked.current = true
      track('proposed-stay-tool-used')
    }
  }, [result])

  useEffect(() => {
    onPreview(range)
    if (!range || !result) {
      onRecap(null)
    } else {
      const dates = `${formatDayShort(range.start)} to ${formatDayShort(range.end)}`
      onRecap(
        result.compliant
          ? { ok: true, text: `${dates}: OK, peaks at ${result.peakUsage}/90` }
          : {
              ok: false,
              text: `${dates}: breaks the rule on ${formatDayShort(result.firstViolation)}`,
            },
      )
    }
    return () => {
      onPreview(null)
      onRecap(null)
    }
  }, [range, result, onPreview, onRecap])

  return (
    <details
      className="tool"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
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
          <>
            <p className="tool-result is-ok" role="status">
              <strong>Compliant.</strong> This trip peaks at{' '}
              <strong>{result.peakUsage}/90</strong> days used.
            </p>
            <CoffeeNudge placement="proposed-stay" />
          </>
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
