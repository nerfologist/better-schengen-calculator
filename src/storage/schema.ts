import { isValidIso, toDayNum } from '../domain/dates'
import type { Stay } from '../domain/types'

export const STORAGE_KEY = 'schengen-calc:data'
export const CORRUPT_KEY = 'schengen-calc:data.corrupt'

export interface PersistedV1 {
  version: 1
  stays: Stay[]
}

export function isStay(value: unknown): value is Stay {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.entry === 'string' &&
    isValidIso(v.entry) &&
    typeof v.exit === 'string' &&
    isValidIso(v.exit) &&
    toDayNum(v.entry) <= toDayNum(v.exit) &&
    (v.label === undefined || typeof v.label === 'string')
  )
}

/** Validate and upgrade raw parsed JSON to the current schema. Throws if unusable. */
export function migrate(raw: unknown): PersistedV1 {
  if (typeof raw !== 'object' || raw === null) throw new Error('Not an object')
  const v = raw as Record<string, unknown>
  switch (v.version) {
    case 1: {
      if (!Array.isArray(v.stays) || !v.stays.every(isStay)) {
        throw new Error('Invalid stays payload')
      }
      return { version: 1, stays: v.stays }
    }
    default:
      throw new Error(`Unknown schema version: ${String(v.version)}`)
  }
}
