import { toDayNum, toIso } from './dates'
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
