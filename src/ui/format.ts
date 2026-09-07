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

/** e.g. "Tue, 14 Jul 2026" */
export function formatDay(day: DayNum): string {
  return LONG.format(utcDate(day))
}

/** e.g. "14 Jul 2026" */
export function formatDayShort(day: DayNum): string {
  return SHORT.format(utcDate(day))
}

/** e.g. "July 2026" */
export function formatMonth(year: number, month0: number): string {
  return MONTH.format(new Date(Date.UTC(year, month0, 1)))
}

export function isoOf(day: DayNum): IsoDate {
  return toIso(day)
}
