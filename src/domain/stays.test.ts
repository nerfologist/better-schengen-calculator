import { describe, expect, it } from 'vitest'
import { toDayNum } from './dates'
import { mergeRanges, mergedRangesOf, rangeLength, toRanges } from './stays'
import type { Stay } from './types'

function stay(entry: string, exit: string, id = 'x'): Stay {
  return { id, entry, exit }
}

describe('stays', () => {
  it('T5: merges adjacent ranges (Jan 1-5 + Jan 6-10 becomes one 10-day range)', () => {
    const merged = mergedRangesOf([
      stay('2026-01-01', '2026-01-05', 'a'),
      stay('2026-01-06', '2026-01-10', 'b'),
    ])
    expect(merged).toHaveLength(1)
    expect(rangeLength(merged[0])).toBe(10)
  })

  it('T12: merges overlapping ranges without double-counting (Jan 1-10 + Jan 5-15 = 15 days)', () => {
    const merged = mergedRangesOf([
      stay('2026-01-01', '2026-01-10', 'a'),
      stay('2026-01-05', '2026-01-15', 'b'),
    ])
    expect(merged).toHaveLength(1)
    expect(rangeLength(merged[0])).toBe(15)
  })

  it('T6: same-day trip counts as 1 day', () => {
    const merged = mergedRangesOf([stay('2026-05-01', '2026-05-01')])
    expect(rangeLength(merged[0])).toBe(1)
  })

  it('keeps non-adjacent ranges separate and sorted', () => {
    const merged = mergedRangesOf([
      stay('2026-03-01', '2026-03-05', 'b'),
      stay('2026-01-01', '2026-01-05', 'a'),
    ])
    expect(merged).toHaveLength(2)
    expect(merged[0].start).toBe(toDayNum('2026-01-01'))
  })

  it('rejects reversed ranges', () => {
    expect(() => toRanges([stay('2026-01-10', '2026-01-01')])).toThrow()
  })

  it('does not mutate its input', () => {
    const input = [
      { start: toDayNum('2026-01-01'), end: toDayNum('2026-01-05') },
      { start: toDayNum('2026-01-03'), end: toDayNum('2026-01-20') },
    ]
    const snapshot = JSON.parse(JSON.stringify(input))
    mergeRanges(input)
    expect(input).toEqual(snapshot)
  })
})
