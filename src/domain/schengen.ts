import type { DayNum } from './dates'
import { mergeRanges } from './stays'
import type { DayRange } from './types'

export const WINDOW_DAYS = 180
export const MAX_STAY_DAYS = 90

/** The rolling window whose last day is refDay: [refDay - 179, refDay]. */
export function windowFor(refDay: DayNum): DayRange {
  return { start: refDay - (WINDOW_DAYS - 1), end: refDay }
}

/** Presence days inside the 180-day window ending on refDay. Ranges must be merged. */
export function presenceInWindow(merged: DayRange[], refDay: DayNum): number {
  const w = windowFor(refDay)
  let total = 0
  for (const r of merged) {
    total += Math.max(0, Math.min(r.end, w.end) - Math.max(r.start, w.start) + 1)
  }
  return total
}

/**
 * Headroom in the window ending on refDay. Not necessarily the maximum
 * continuous stay starting tomorrow, since old days rolling off the window can
 * allow more. latestExit() is the authoritative planning answer.
 */
export function daysRemaining(merged: DayRange[], refDay: DayNum): number {
  return Math.max(0, MAX_STAY_DAYS - presenceInWindow(merged, refDay))
}

export type LatestExitResult =
  | { ok: true; exitDay: DayNum; stayLength: number }
  | {
      ok: false
      reason: 'entry-day-not-compliant'
      usedOnEntry: number
      earliestEntry: DayNum | null
    }
  | { ok: false; reason: 'conflicts-with-future-stay'; conflictDay: DayNum }

/**
 * First recorded presence day after afterDay that breaks the rule under
 * `combined` but was compliant under the baseline history. Pre-existing
 * violations never block planning; findHistoricalViolations surfaces those.
 */
function firstNewFutureViolation(
  combined: DayRange[],
  baseline: DayRange[],
  afterDay: DayNum,
): DayNum | null {
  for (const r of baseline) {
    if (r.end <= afterDay) continue
    for (let d = Math.max(r.start, afterDay + 1); d <= r.end; d++) {
      if (
        presenceInWindow(combined, d) > MAX_STAY_DAYS &&
        presenceInWindow(baseline, d) <= MAX_STAY_DAYS
      ) {
        return d
      }
    }
  }
  return null
}

/**
 * Latest allowed exit day for a continuous stay entered on entryDay, given the
 * recorded history. The stay's own days must all be compliant, and the stay
 * must not create new violations on already-recorded future stays.
 */
export function latestExit(merged: DayRange[], entryDay: DayNum): LatestExitResult {
  const entryOnly = mergeRanges([...merged, { start: entryDay, end: entryDay }])
  const usedOnEntry = presenceInWindow(entryOnly, entryDay)
  if (usedOnEntry > MAX_STAY_DAYS) {
    return {
      ok: false,
      reason: 'entry-day-not-compliant',
      usedOnEntry,
      earliestEntry: earliestCompliantEntry(merged, entryDay),
    }
  }
  const entryConflict = firstNewFutureViolation(entryOnly, merged, entryDay)
  if (entryConflict !== null) {
    return { ok: false, reason: 'conflicts-with-future-stay', conflictDay: entryConflict }
  }

  // Adding presence never lowers any window count, so the first exit day whose
  // combined history violates is final: extend day by day until just before it.
  // A window ending on day d only sees days <= d, so checking each new day at
  // its own step is exact even though later steps extend the stay.
  let exitDay = entryDay
  const cap = entryDay + MAX_STAY_DAYS - 1
  while (exitDay < cap) {
    const next = exitDay + 1
    const combined = mergeRanges([...merged, { start: entryDay, end: next }])
    if (presenceInWindow(combined, next) > MAX_STAY_DAYS) break
    if (firstNewFutureViolation(combined, merged, next) !== null) break
    exitDay = next
  }
  return { ok: true, exitDay, stayLength: exitDay - entryDay + 1 }
}

/** First day >= fromDay on which a 1-day entry would be compliant. */
function earliestCompliantEntry(merged: DayRange[], fromDay: DayNum): DayNum | null {
  const lastDay = merged.reduce((max, r) => Math.max(max, r.end), fromDay)
  // All history rolls off the window within WINDOW_DAYS of the last recorded day.
  for (let d = fromDay; d <= lastDay + WINDOW_DAYS; d++) {
    const combined = mergeRanges([...merged, { start: d, end: d }])
    if (presenceInWindow(combined, d) <= MAX_STAY_DAYS) return d
  }
  return null
}

export type CheckStayResult =
  | { compliant: true; peakUsage: number }
  | {
      compliant: false
      firstViolation: DayNum
      overshoot: number
      latestCompliantExit: DayNum | null
    }

/**
 * Would a proposed stay [start, end], on top of the history, obey the rule?
 * Non-compliance is either a proposal day over the limit or a new violation
 * the proposal creates on an already-recorded future stay. latestCompliantExit
 * is the longest allowed stay from the same start (null if none).
 */
export function checkStay(
  merged: DayRange[],
  start: DayNum,
  end: DayNum,
): CheckStayResult {
  if (end < start) throw new Error('Proposed stay has exit before entry')
  const combined = mergeRanges([...merged, { start, end }])

  let violation: DayNum | null = null
  let peak = 0
  for (let d = start; d <= end && violation === null; d++) {
    const count = presenceInWindow(combined, d)
    if (count > MAX_STAY_DAYS) violation = d
    peak = Math.max(peak, count)
  }
  if (violation === null) {
    violation = firstNewFutureViolation(combined, merged, end)
  }
  if (violation === null) {
    return { compliant: true, peakUsage: peak }
  }

  const best = latestExit(merged, start)
  return {
    compliant: false,
    firstViolation: violation,
    overshoot: presenceInWindow(combined, violation) - MAX_STAY_DAYS,
    latestCompliantExit: best.ok ? best.exitDay : null,
  }
}

/** Contiguous runs of recorded presence days that already break the rule. */
export function findHistoricalViolations(
  merged: DayRange[],
): { start: DayNum; end: DayNum; peak: number }[] {
  const violations: { start: DayNum; end: DayNum; peak: number }[] = []
  let current: { start: DayNum; end: DayNum; peak: number } | null = null
  for (const r of merged) {
    for (let d = r.start; d <= r.end; d++) {
      const count = presenceInWindow(merged, d)
      if (count > MAX_STAY_DAYS) {
        if (current && current.end === d - 1) {
          current.end = d
          current.peak = Math.max(current.peak, count)
        } else {
          current = { start: d, end: d, peak: count }
          violations.push(current)
        }
      }
    }
  }
  return violations
}

export interface Summary {
  used: number
  remaining: number
  window: DayRange
  latestExitIfEnteringToday: DayNum | null
}

export function computeSummary(merged: DayRange[], todayNum: DayNum): Summary {
  const result = latestExit(merged, todayNum)
  return {
    used: presenceInWindow(merged, todayNum),
    remaining: daysRemaining(merged, todayNum),
    window: windowFor(todayNum),
    latestExitIfEnteringToday: result.ok ? result.exitDay : null,
  }
}
