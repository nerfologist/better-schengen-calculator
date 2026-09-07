import { describe, expect, it } from 'vitest'
import { addDays, toDayNum, toIso } from './dates'
import { mergedRangesOf } from './stays'
import {
  checkStay,
  computeSummary,
  daysRemaining,
  findHistoricalViolations,
  latestExit,
  presenceInWindow,
  windowFor,
} from './schengen'
import type { Stay } from './types'

function history(...ranges: [string, string][]) {
  const stays: Stay[] = ranges.map(([entry, exit], i) => ({
    id: `s${i}`,
    entry,
    exit,
  }))
  return mergedRangesOf(stays)
}

const d = toDayNum

describe('presenceInWindow / daysRemaining', () => {
  it('T1: no stays means 0 used, 90 remaining', () => {
    expect(presenceInWindow([], d('2026-09-07'))).toBe(0)
    expect(daysRemaining([], d('2026-09-07'))).toBe(90)
  })

  it('T2: 10-day stay fully inside the window', () => {
    const merged = history(['2026-01-01', '2026-01-10'])
    expect(presenceInWindow(merged, d('2026-03-01'))).toBe(10)
    expect(daysRemaining(merged, d('2026-03-01'))).toBe(80)
  })

  it('T3: stay fully outside (older than) the window counts 0', () => {
    const merged = history(['2025-01-01', '2025-01-31'])
    expect(presenceInWindow(merged, d('2026-09-07'))).toBe(0)
    expect(daysRemaining(merged, d('2026-09-07'))).toBe(90)
  })

  it('T4: stay straddling the window start counts only the inside part', () => {
    const ref = d('2026-09-07')
    const merged = [{ start: ref - 184, end: ref - 175 }] // 10 days, 5 inside
    expect(presenceInWindow(merged, ref)).toBe(5)
  })

  it('window is 180 days ending on the reference day', () => {
    const ref = d('2026-09-07')
    const w = windowFor(ref)
    expect(w.end - w.start + 1).toBe(180)
    expect(toIso(w.start)).toBe('2026-03-12')
  })
})

describe('latestExit', () => {
  it('T1: with no history you get the full 90 days', () => {
    const result = latestExit([], d('2026-06-15'))
    expect(result).toEqual({
      ok: true,
      exitDay: d('2026-06-15') + 89,
      stayLength: 90,
    })
  })

  it('T7: 60 prior days leave a 30-day stay (no rolloff during it)', () => {
    const merged = history(['2026-04-01', '2026-05-30'])
    const result = latestExit(merged, d('2026-06-15'))
    expect(result).toEqual({
      ok: true,
      exitDay: d('2026-07-14'),
      stayLength: 30,
    })
  })

  it('T8: prior stay rolling off mid-visit still allows a full 90-day stay', () => {
    const merged = history(['2025-12-20', '2026-01-18']) // 30 days
    const result = latestExit(merged, d('2026-06-10'))
    expect(result).toEqual({
      ok: true,
      exitDay: d('2026-09-07'),
      stayLength: 90,
    })
  })

  it('T9: after 90 straight days ending today, tomorrow is not compliant; re-entry after 90 days out', () => {
    const today = '2026-09-07'
    const merged = history([addDays(today, -89), today])
    const result = latestExit(merged, d(today) + 1)
    expect(result).toEqual({
      ok: false,
      reason: 'entry-day-not-compliant',
      usedOnEntry: 91,
      earliestEntry: d(today) + 91,
    })
  })

  it('entering during a recorded stay works (merged with it)', () => {
    const merged = history(['2026-06-01', '2026-06-20'])
    const result = latestExit(merged, d('2026-06-10'))
    // 20 recorded days; continuous presence from Jun 1 can last 90 days total.
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.exitDay).toBe(d('2026-06-01') + 89)
  })

  it('respects already-recorded future stays after the entry date', () => {
    // 60 days recorded in the near past + a 15-day future booking.
    const merged = history(
      ['2026-05-21', '2026-07-19'], // 60 days
      ['2026-09-20', '2026-10-04'], // 15 future days
    )
    const result = latestExit(merged, d('2026-08-01'))
    // Own headroom would allow 30 days, but the booking's last day (Oct 4)
    // caps it: 60 + len + 15 <= 90, so len <= 15 and exit is Aug 15.
    expect(result).toEqual({
      ok: true,
      exitDay: d('2026-08-15'),
      stayLength: 15,
    })
    const combined = mergedRangesOf([
      { id: 'a', entry: '2026-05-21', exit: '2026-07-19' },
      { id: 'b', entry: '2026-09-20', exit: '2026-10-04' },
      { id: 'c', entry: '2026-08-01', exit: '2026-08-15' },
    ])
    expect(findHistoricalViolations(combined)).toEqual([])
  })

  it('reports a conflict when even a 1-day entry would break a future booking', () => {
    // 15 past days + a 75-day future booking that sits exactly at 90 on Dec 3.
    const merged = history(
      ['2026-07-01', '2026-07-15'],
      ['2026-09-20', '2026-12-03'],
    )
    const result = latestExit(merged, d('2026-08-01'))
    expect(result).toEqual({
      ok: false,
      reason: 'conflicts-with-future-stay',
      conflictDay: d('2026-12-03'),
    })
  })

  it('pre-existing violations in recorded history do not block planning', () => {
    // A recorded 100-day overstay long past; planning later is unaffected
    // once it is outside the window.
    const merged = history(['2025-01-01', '2025-04-10'])
    const result = latestExit(merged, d('2026-06-15'))
    expect(result).toEqual({
      ok: true,
      exitDay: d('2026-06-15') + 89,
      stayLength: 90,
    })
  })
})

describe('checkStay', () => {
  it('T10: proposing a stay right after 90 straight days violates on day one', () => {
    const today = '2026-09-07'
    const merged = history([addDays(today, -89), today])
    const result = checkStay(merged, d(today) + 1, d(today) + 5)
    expect(result).toEqual({
      compliant: false,
      firstViolation: d(today) + 1,
      overshoot: 1,
      latestCompliantExit: null,
    })
  })

  it('T11a: exact-fit stay is compliant and peaks at 90', () => {
    const merged = history(['2026-04-01', '2026-05-30'])
    const result = checkStay(merged, d('2026-06-15'), d('2026-07-14'))
    expect(result).toEqual({ compliant: true, peakUsage: 90 })
  })

  it('T11b: overshooting by 6 days reports the first violation and the latest compliant exit', () => {
    const merged = history(['2026-04-01', '2026-05-30'])
    const result = checkStay(merged, d('2026-06-15'), d('2026-07-20'))
    expect(result).toEqual({
      compliant: false,
      firstViolation: d('2026-07-15'),
      overshoot: 1,
      latestCompliantExit: d('2026-07-14'),
    })
  })

  it('rejects reversed proposals', () => {
    expect(() => checkStay([], d('2026-07-14'), d('2026-06-15'))).toThrow()
  })
})

describe('findHistoricalViolations', () => {
  it('T13: a recorded 100-day stay flags days 91-100 with peak 100', () => {
    const merged = history(['2026-01-01', '2026-04-10']) // 100 days
    const violations = findHistoricalViolations(merged)
    expect(violations).toEqual([
      { start: d('2026-04-01'), end: d('2026-04-10'), peak: 100 },
    ])
  })

  it('clean history has no violations', () => {
    const merged = history(['2026-04-01', '2026-05-30'])
    expect(findHistoricalViolations(merged)).toEqual([])
  })
})

describe('computeSummary', () => {
  it('combines used/remaining/window/latest-exit for today', () => {
    const merged = history(['2026-04-01', '2026-05-30'])
    const today = d('2026-06-15')
    const summary = computeSummary(merged, today)
    expect(summary.used).toBe(60)
    expect(summary.remaining).toBe(30)
    expect(summary.window).toEqual(windowFor(today))
    expect(summary.latestExitIfEnteringToday).toBe(d('2026-07-14'))
  })

  it('reports null latest exit when even today is not compliant', () => {
    const today = '2026-09-07'
    const merged = history([addDays(today, -90), addDays(today, -1)]) // 90 days ending yesterday
    const summary = computeSummary(merged, d(today))
    expect(summary.latestExitIfEnteringToday).toBeNull()
  })
})

describe('T14: property check, latestExit is tight', () => {
  // Deterministic pseudo-random fixtures (LCG) so failures are reproducible.
  function lcg(seed: number) {
    let s = seed
    return () => {
      s = (s * 48271) % 2147483647
      return s / 2147483647
    }
  }

  it('latestExit result is compliant and one more day is not', () => {
    const base = d('2026-01-01')
    for (let seed = 1; seed <= 25; seed++) {
      const rand = lcg(seed)
      const ranges: { start: number; end: number }[] = []
      const count = 1 + Math.floor(rand() * 4)
      for (let i = 0; i < count; i++) {
        const start = base + Math.floor(rand() * 200)
        const end = start + Math.floor(rand() * 40)
        ranges.push({ start, end })
      }
      const merged = mergedRangesOf(
        ranges.map((r, i) => ({ id: `r${i}`, entry: toIso(r.start), exit: toIso(r.end) })),
      )
      const entry = base + 210 + Math.floor(rand() * 60)
      const result = latestExit(merged, entry)
      if (!result.ok) {
        if (result.reason === 'entry-day-not-compliant') {
          expect(result.usedOnEntry).toBeGreaterThan(90)
        }
        continue
      }
      expect(checkStay(merged, entry, result.exitDay).compliant).toBe(true)
      if (result.stayLength < 90) {
        expect(checkStay(merged, entry, result.exitDay + 1).compliant).toBe(false)
      }
    }
  })
})
