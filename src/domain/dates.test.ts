import { describe, expect, it } from 'vitest'
import { addDays, isValidIso, toDayNum, toIso } from './dates'

describe('dates', () => {
  it('round-trips ISO dates through day numbers', () => {
    const samples = [
      '1970-01-01',
      '2024-02-29', // leap day
      '2026-03-29', // EU DST spring-forward day
      '2026-10-25', // EU DST fall-back day
      '2026-12-31',
      '2099-06-15',
    ]
    for (const iso of samples) {
      expect(toIso(toDayNum(iso))).toBe(iso)
    }
  })

  it('day numbers are integers and consecutive across DST boundaries', () => {
    const a = toDayNum('2026-03-28')
    const b = toDayNum('2026-03-29')
    const c = toDayNum('2026-03-30')
    expect(Number.isInteger(a)).toBe(true)
    expect(b - a).toBe(1)
    expect(c - b).toBe(1)
  })

  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-06-10', 89)).toBe('2026-09-07')
  })

  it('validates real calendar dates only', () => {
    expect(isValidIso('2024-02-29')).toBe(true)
    expect(isValidIso('2026-02-29')).toBe(false)
    expect(isValidIso('2026-13-01')).toBe(false)
    expect(isValidIso('2026-00-10')).toBe(false)
    expect(isValidIso('2026-1-1')).toBe(false)
    expect(isValidIso('not-a-date')).toBe(false)
    expect(isValidIso('')).toBe(false)
  })
})
