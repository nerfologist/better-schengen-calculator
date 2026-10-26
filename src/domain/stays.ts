import { toDayNum, toIso } from './dates'
import { MAX_RECORDED_STAY_DAYS, MAX_STAYS } from './limits'
import type { DayRange, Stay } from './types'

export function toRanges(stays: Stay[]): DayRange[] {
  return stays.map((s) => {
    const start = toDayNum(s.entry)
    const end = toDayNum(s.exit)
    if (end < start) throw new Error(`Stay ${s.id} has exit before entry`)
    return { start, end }
  })
}

/**
 * Sort and merge overlapping AND adjacent ranges (a gap of zero days merges),
 * so downstream counting never double-counts a presence day.
 */
export function mergeRanges(ranges: DayRange[]): DayRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const merged: DayRange[] = []
  for (const r of sorted) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end + 1) {
      last.end = Math.max(last.end, r.end)
    } else {
      merged.push({ ...r })
    }
  }
  return merged
}

export function rangeLength(r: DayRange): number {
  return r.end - r.start + 1
}

export function mergedRangesOf(stays: Stay[]): DayRange[] {
  return mergeRanges(toRanges(stays))
}

/**
 * Add a stay while keeping the invariant that no day belongs to two stays:
 * any existing stays sharing at least one day with the new one are absorbed
 * into a single record spanning them all. Adjacent-but-disjoint stays stay
 * separate; they are distinct trips.
 */
export function mergeStayInto(stays: Stay[], stay: Stay): Stay[] {
  const start = toDayNum(stay.entry)
  const end = toDayNum(stay.exit)
  const overlapping = stays.filter(
    (s) => toDayNum(s.entry) <= end && start <= toDayNum(s.exit),
  )
  if (overlapping.length === 0) return [...stays, stay]

  const all = [...overlapping, stay]
  const merged: Stay = {
    id: stay.id,
    entry: toIso(Math.min(...all.map((s) => toDayNum(s.entry)))),
    exit: toIso(Math.max(...all.map((s) => toDayNum(s.exit)))),
    label: stay.label ?? overlapping.find((s) => s.label)?.label,
  }
  return [...stays.filter((s) => !overlapping.includes(s)), merged]
}

/**
 * Check an add or update against the storage limits AFTER merging. Returns a
 * user-facing message, or null when the change is safe to dispatch.
 */
export function checkStayChange(stays: Stay[], candidate: Stay): string | null {
  // Match the reducer's update semantics: remove the previous version of the
  // same stay before merging, otherwise an edit would count both versions.
  const next = mergeStayInto(
    stays.filter((s) => s.id !== candidate.id),
    candidate,
  )
  if (next.length > MAX_STAYS) {
    return `You can store up to ${MAX_STAYS} stays on this device. Delete an old stay first.`
  }
  for (const s of next) {
    if (toDayNum(s.exit) - toDayNum(s.entry) + 1 > MAX_RECORDED_STAY_DAYS) {
      return `Adding this stay would create a period longer than ${MAX_RECORDED_STAY_DAYS} days. Shorten the dates.`
    }
  }
  return null
}
