import { toDayNum, type IsoDate } from './dates'

/**
 * Hard bounds for dates the app accepts from storage, imports, and date inputs.
 * They are deliberately much wider than any realistic short stay, while keeping
 * every calendar walk bounded.
 */
export const MIN_SUPPORTED_ISO: IsoDate = '1900-01-01'
export const MAX_SUPPORTED_ISO: IsoDate = '2100-12-31'
export const MIN_SUPPORTED_DAY = toDayNum(MIN_SUPPORTED_ISO)
export const MAX_SUPPORTED_DAY = toDayNum(MAX_SUPPORTED_ISO)

/** Longest single recorded stay. The timeline can span more than a year. */
export const MAX_RECORDED_STAY_DAYS = 730

/** Guards against pathological backups filling storage and render work. */
export const MAX_STAYS = 200
export const MAX_LABEL_LENGTH = 60
export const MAX_IMPORT_BYTES = 1_000_000

/** Caller must pass dates that already passed isValidIso(). */
export function isSupportedStay(entry: IsoDate, exit: IsoDate): boolean {
  const start = toDayNum(entry)
  const end = toDayNum(exit)
  return (
    start >= MIN_SUPPORTED_DAY &&
    end <= MAX_SUPPORTED_DAY &&
    end >= start &&
    end - start + 1 <= MAX_RECORDED_STAY_DAYS
  )
}
