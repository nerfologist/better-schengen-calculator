import { isValidIso } from '../domain/dates'
import {
  MAX_STAYS,
  isSafeId,
  isSafeLabel,
  isSupportedStay,
} from '../domain/limits'
import type { Stay } from '../domain/types'

export const STORAGE_KEY = 'schengen-calc:data'
export const CORRUPT_KEY = 'schengen-calc:data.corrupt'

/** Planning inputs that also live on device and should be cleared together. */
export const PLAN_KEYS = {
  maxEntry: 'schengen-calc:plan.maxEntry',
  proposedStart: 'schengen-calc:plan.proposedStart',
  proposedEnd: 'schengen-calc:plan.proposedEnd',
} as const

export interface PersistedV1 {
  version: 1
  stays: Stay[]
}

export function isStay(value: unknown): value is Stay {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || !isSafeId(v.id)) return false
  if (typeof v.entry !== 'string' || !isValidIso(v.entry)) return false
  if (typeof v.exit !== 'string' || !isValidIso(v.exit)) return false
  if (!isSupportedStay(v.entry, v.exit)) return false
  if (v.label !== undefined) {
    if (typeof v.label !== 'string' || !isSafeLabel(v.label)) return false
  }
  return true
}

/** Validate and upgrade raw parsed JSON to the current schema. Throws if unusable. */
export function migrate(raw: unknown): PersistedV1 {
  if (typeof raw !== 'object' || raw === null) throw new Error('Not an object')
  const v = raw as Record<string, unknown>
  switch (v.version) {
    case 1: {
      if (
        !Array.isArray(v.stays) ||
        v.stays.length > MAX_STAYS ||
        !v.stays.every(isStay)
      ) {
        throw new Error('Invalid stays payload')
      }
      const ids = new Set<string>()
      for (const stay of v.stays) {
        if (ids.has(stay.id)) throw new Error(`Duplicate stay id: ${stay.id}`)
        ids.add(stay.id)
      }
      // Keep only known fields so imported files can't smuggle extra data
      // into localStorage.
      return {
        version: 1,
        stays: v.stays.map(({ id, entry, exit, label }) => ({
          id,
          entry,
          exit,
          ...(label !== undefined ? { label } : {}),
        })),
      }
    }
    default:
      throw new Error(`Unknown schema version: ${String(v.version)}`)
  }
}
