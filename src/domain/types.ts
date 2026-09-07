import type { DayNum, IsoDate } from './dates'

/** One stay in the Schengen area. Entry and exit days both count as presence. */
export interface Stay {
  id: string
  entry: IsoDate
  exit: IsoDate
  label?: string
}

/** Inclusive range of day numbers. */
export interface DayRange {
  start: DayNum
  end: DayNum
}
