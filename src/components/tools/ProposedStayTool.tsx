import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from '../../analytics/goatcounter'
import { isValidIso, toDayNum } from '../../domain/dates'
import {
  MAX_RECORDED_STAY_DAYS,
  MAX_SUPPORTED_ISO,
  MIN_SUPPORTED_ISO,
  isSupportedStay,
} from '../../domain/limits'
import { checkStay } from '../../domain/schengen'
import type { DayRange } from '../../domain/types'
import { useStays } from '../../state/StaysContext'
import { PLAN_KEYS } from '../../storage/schema'
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
  const [start, setStart] = usePersistedInput(PLAN_KEYS.proposedStart)
  const [end, setEnd] = usePersistedInput(PLAN_KEYS.proposedEnd)
  // Persisted dates mean an ongoing calculation: start open so it shows.
  const [open, setOpen] = useState(() => start !== '' || end !== '')

  const range = useMemo<DayRange | null>(() => {
    if (!isValidIso(start) || !isValidIso(end) || !isSupportedStay(start, end)) {
      return null
    }
    return { start: toDayNum(start), end: toDayNum(end) }
  }, [start, end])

  const invalidRange =
    start !== '' &&
    end !== '' &&
    isValidIso(start) &&
    isValidIso(end) &&
    !isSupportedStay(start, end)

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
  }, [range, result, onPreview, onRecap])

  // Clear the shared preview only when this tool unmounts; doing it in the
  // update effect above would null it and immediately set it again on every
  // keystroke, doubling the parent render.
  useEffect(
    () => () => {
      onPreview(null)
      onRecap(null)
    },
    [onPreview, onRecap],
  )

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
              min={MIN_SUPPORTED_ISO}
              max={end || MAX_SUPPORTED_ISO}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            Exit
            <input
              type="date"
              min={start || MIN_SUPPORTED_ISO}
              max={MAX_SUPPORTED_ISO}
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
        {invalidRange && (
          <p className="form-error" role="alert">
            Enter dates between {MIN_SUPPORTED_ISO} and {MAX_SUPPORTED_ISO} with a
            stay of at most {MAX_RECORDED_STAY_DAYS} days.
          </p>
        )}
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
