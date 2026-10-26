import { MAX_IMPORT_BYTES } from '../domain/limits'
import type { Stay } from '../domain/types'
import { CORRUPT_KEY, STORAGE_KEY, migrate, type PersistedV1 } from './schema'

function pack(stays: Stay[]): PersistedV1 {
  return { version: 1, stays }
}

/**
 * localStorage itself can throw when site data is blocked (some private modes,
 * embedded webviews), even before getItem/setItem is called.
 */
function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function load(storage: Storage | null = defaultStorage()): Stay[] {
  if (!storage) return []
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return []
  }
  if (raw === null) return []
  try {
    return migrate(JSON.parse(raw)).stays
  } catch {
    // Never silently destroy data: keep the unreadable payload aside.
    try {
      storage.setItem(CORRUPT_KEY, raw)
    } catch {
      // Quarantine is best effort; the original value is still in place.
    }
    return []
  }
}

/** Returns false when the device refused the write (quota, blocked storage). */
export function save(
  stays: Stay[],
  storage: Storage | null = defaultStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(pack(stays)))
    return true
  } catch {
    return false
  }
}

/** Best-effort request to exempt this origin from storage eviction. */
export function requestPersistence(): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      void navigator.storage.persist().catch(() => {
        // Persistence is optional; the app still works without it.
      })
    }
  } catch {
    // Ignore environments that expose a partial StorageManager.
  }
}

export function exportJson(stays: Stay[]): string {
  return JSON.stringify(pack(stays), null, 2)
}

/** Parse a backup file. Throws a descriptive Error on invalid content. */
export function importJson(text: string): Stay[] {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new Error('Backup file is too large')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Not a valid JSON file')
  }
  try {
    return migrate(parsed).stays
  } catch (e) {
    throw new Error(`Not a valid backup: ${e instanceof Error ? e.message : String(e)}`)
  }
}
