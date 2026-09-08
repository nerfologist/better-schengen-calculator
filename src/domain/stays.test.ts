import { describe, expect, it } from 'vitest'
import { toDayNum } from './dates'
import { mergeRanges, mergeStayInto, mergedRangesOf, rangeLength, toRanges } from './stays'
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

  describe('mergeStayInto (no day belongs to two stays)', () => {
    const existing = [
      stay('2026-01-01', '2026-01-10', 'a'),
      stay('2026-03-01', '2026-03-05', 'b'),
    ]

    it('appends a non-overlapping stay', () => {
      const result = mergeStayInto(existing, stay('2026-02-01', '2026-02-05', 'c'))
      expect(result).toHaveLength(3)
    })

    it('absorbs an overlapping stay into one record', () => {
      const result = mergeStayInto(existing, stay('2026-01-05', '2026-01-20', 'c'))
      expect(result).toHaveLength(2)
      const merged = result.find((s) => s.id === 'c')
      expect(merged).toMatchObject({ entry: '2026-01-01', exit: '2026-01-20' })
    })

    it('re-adding the same range changes nothing but the record id', () => {
      const result = mergeStayInto(existing, stay('2026-01-01', '2026-01-10', 'c'))
      expect(result).toHaveLength(2)
      expect(result.find((s) => s.id === 'c')).toMatchObject({
        entry: '2026-01-01',
        exit: '2026-01-10',
      })
    })

    it('a range spanning several stays absorbs them all', () => {
      const result = mergeStayInto(existing, stay('2026-01-08', '2026-03-02', 'c'))
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ entry: '2026-01-01', exit: '2026-03-05' })
    })

    it('keeps adjacent-but-disjoint trips separate', () => {
      const result = mergeStayInto(existing, stay('2026-01-11', '2026-01-15', 'c'))
      expect(result).toHaveLength(3)
    })

    it('prefers the new label, falls back to the absorbed stay label', () => {
      const labelled = [{ ...stay('2026-01-01', '2026-01-10', 'a'), label: 'Paris' }]
      expect(mergeStayInto(labelled, stay('2026-01-05', '2026-01-12', 'b'))[0].label).toBe('Paris')
      expect(
        mergeStayInto(labelled, { ...stay('2026-01-05', '2026-01-12', 'b'), label: 'Lyon' })[0]
          .label,
      ).toBe('Lyon')
    })
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
