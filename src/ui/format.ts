import { toIso, type DayNum, type IsoDate } from '../domain/dates'

const MS_PER_DAY = 86_400_000

const LONG = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const SHORT = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const MONTH = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function utcDate(day: DayNum): Date {
  return new Date(day * MS_PER_DAY)
}

// Intl formatting and Date allocation are relatively expensive when called
// for every calendar cell on every render. Calendar days are stable strings,
// so cache them; the maps are bounded by the number of days ever viewed.
const dayCache = new Map<DayNum, string>()
const shortCache = new Map<DayNum, string>()
const monthCache = new Map<string, string>()

/** e.g. "Tue, 14 Jul 2026" */
export function formatDay(day: DayNum): string {
  let value = dayCache.get(day)
  if (value === undefined) {
    value = LONG.format(utcDate(day))
    dayCache.set(day, value)
  }
  return value
}

/** e.g. "14 Jul 2026" */
export function formatDayShort(day: DayNum): string {
  let value = shortCache.get(day)
  if (value === undefined) {
    value = SHORT.format(utcDate(day))
    shortCache.set(day, value)
  }
  return value
}

/** e.g. "July 2026" */
export function formatMonth(year: number, month0: number): string {
  const key = `${year}-${month0}`
  let value = monthCache.get(key)
  if (value === undefined) {
    value = MONTH.format(new Date(Date.UTC(year, month0, 1)))
    monthCache.set(key, value)
  }
  return value
}

export function isoOf(day: DayNum): IsoDate {
  return toIso(day)
}
