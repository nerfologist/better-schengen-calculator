/** Calendar date as "YYYY-MM-DD". Used at the edges: storage, UI, inputs. */
export type IsoDate = string

/** Days since 1970-01-01. All window arithmetic happens on these integers. */
export type DayNum = number

const MS_PER_DAY = 86_400_000
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function toDayNum(iso: IsoDate): DayNum {
  const m = ISO_RE.exec(iso)
  if (!m) throw new Error(`Invalid ISO date: ${iso}`)
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY
}

export function toIso(day: DayNum): IsoDate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10)
}

/** Today according to the user's local calendar (the only local-time read). */
export function todayIso(): IsoDate {
  const now = new Date()
  const y = String(now.getFullYear()).padStart(4, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  return toIso(toDayNum(iso) + n)
}

/** True only for a well-formed ISO string naming a real calendar date. */
export function isValidIso(s: string): s is IsoDate {
  const m = ISO_RE.exec(s)
  if (!m) return false
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return (
    date.getUTCFullYear() === Number(m[1]) &&
    date.getUTCMonth() === Number(m[2]) - 1 &&
    date.getUTCDate() === Number(m[3])
  )
}
