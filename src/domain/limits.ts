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
export const MAX_STAYS = 2000
export const MAX_LABEL_LENGTH = 60
export const MAX_IMPORT_BYTES = 1_000_000

/** Control characters and bidi overrides that can visually spoof the UI. */
export const UNSAFE_TEXT = /[\p{Cc}\u202A-\u202E\u2066-\u2069]/u

export function isSafeId(id: string): boolean {
  return id.length > 0 && id.length <= 64 && !UNSAFE_TEXT.test(id)
}

export function isSafeLabel(label: string): boolean {
  return label.length <= MAX_LABEL_LENGTH && !UNSAFE_TEXT.test(label)
}

/** Strip unsafe formatting characters and normalise an optional label. */
export function cleanLabel(label: string): string | undefined {
  const cleaned = label.replace(UNSAFE_TEXT, '').trim().slice(0, MAX_LABEL_LENGTH)
  return cleaned || undefined
}

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
