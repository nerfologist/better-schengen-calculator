import { toDayNum } from './dates'
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
