import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { addDays, toDayNum, type IsoDate } from '../src/domain/dates'
import { latestExit } from '../src/domain/schengen'
import { mergedRangesOf } from '../src/domain/stays'

/**
 * Runs the official EU calculator (vendored verbatim in test/fixtures) as an
 * oracle: the page is loaded in jsdom, its form is filled in planning mode,
 * and the reported "stay may be authorised for up to N day(s)" is compared
 * with our latestExit. This pins our engine to the reference implementation,
 * including the rolling-window rolloff behaviour during a stay.
 */

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/eu-calculator')
const html = readFileSync(join(fixtureDir, 'calculator.htm'), 'utf8')
const fixtureUrl = `${pathToFileURL(join(fixtureDir, 'calculator.htm')).href}?lang=en`

type StayRange = [IsoDate, IsoDate]

function euDate(iso: IsoDate): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

/** Allowed stay length according to the official calculator, planning mode. */
async function euAllowedDays(stays: StayRange[], entry: IsoDate): Promise<number | null> {
  const dom = new JSDOM(html, {
    url: fixtureUrl,
    runScripts: 'dangerously',
    resources: 'usable',
    beforeParse(window) {
      window.alert = () => {}
      window.confirm = () => true
    },
  })
  try {
    await new Promise<void>((resolve, reject) => {
      dom.window.addEventListener('load', () => resolve())
      dom.window.addEventListener('error', (e) => reject(new Error(String(e))))
    })
    const doc = dom.window.document
    const fill = (id: string, value: string) => {
      const el = doc.getElementById(id) as HTMLInputElement | null
      if (!el) throw new Error(`Missing element #${id} in the EU calculator page`)
      el.value = value
      el.dispatchEvent(new dom.window.Event('change'))
    }
    fill('TxtField', euDate(entry))
    stays.forEach(([from, to], i) => {
      fill(`fra${i}`, euDate(from))
      fill(`til${i}`, euDate(to))
    })
    ;(doc.getElementById('cmdCalculate') as HTMLInputElement).click()
    const report = (doc.getElementById('report')?.textContent ?? '').replace(/\s+/g, ' ')
    const match = /up to:?\s*(\d+)\s*day/i.exec(report)
    return match ? Number(match[1]) : null
  } finally {
    dom.window.close()
  }
}

function ourAllowedDays(stays: StayRange[], entry: IsoDate): number {
  const merged = mergedRangesOf(stays.map(([e, x], i) => ({ id: `s${i}`, entry: e, exit: x })))
  const result = latestExit(merged, toDayNum(entry))
  return result.ok ? result.stayLength : 0
}

async function expectAgreement(stays: StayRange[], entry: IsoDate) {
  expect(await euAllowedDays(stays, entry), `stays ${JSON.stringify(stays)} entry ${entry}`).toBe(
    ourAllowedDays(stays, entry),
  )
}

describe('agreement with the official EU calculator', () => {
  it('60 prior days, no rolloff during the stay', async () => {
    await expectAgreement([['2026-04-01', '2026-05-30']], '2026-06-15')
  })

  it('prior stay rolling off mid-visit extends the allowance', async () => {
    const stays: StayRange[] = [['2025-12-20', '2026-01-18']]
    await expectAgreement(stays, '2026-06-10')
    // Guard the interesting property too, not just agreement.
    expect(ourAllowedDays(stays, '2026-06-10')).toBe(90)
  })

  it('partial rolloff across scattered stays', async () => {
    await expectAgreement(
      [
        ['2026-04-06', '2026-05-30'],
        ['2026-08-20', '2026-08-29'],
      ],
      '2026-10-01',
    )
  })

  it('90-in/90-out lockout', async () => {
    await expectAgreement([['2026-06-10', '2026-09-07']], '2026-09-08')
  })

  it('adjacent stays', async () => {
    await expectAgreement(
      [
        ['2026-07-01', '2026-07-10'],
        ['2026-07-11', '2026-07-20'],
      ],
      '2026-08-01',
    )
  })

  it('randomized scenarios (seeded)', async () => {
    // Deterministic LCG so a failure names a reproducible seed.
    const lcg = (seed: number) => {
      let s = seed
      return () => ((s = (s * 48271) % 2147483647), s / 2147483647)
    }
    for (let seed = 1; seed <= 15; seed++) {
      const rand = lcg(seed)
      const base = '2026-01-01'
      // The EU form requires chronological, non-overlapping stays.
      const stays: StayRange[] = []
      let cursor = 0
      const n = 1 + Math.floor(rand() * 3)
      for (let i = 0; i < n; i++) {
        const start = cursor + 1 + Math.floor(rand() * 60)
        const len = 1 + Math.floor(rand() * 45)
        stays.push([addDays(base, start), addDays(base, start + len - 1)])
        cursor = start + len
      }
      const entry = addDays(base, cursor + 1 + Math.floor(rand() * 90))
      expect(
        await euAllowedDays(stays, entry),
        `seed ${seed}: stays ${JSON.stringify(stays)} entry ${entry}`,
      ).toBe(ourAllowedDays(stays, entry))
    }
  }, 30_000)
})
