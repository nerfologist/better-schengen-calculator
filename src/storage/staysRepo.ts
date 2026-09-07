import type { Stay } from '../domain/types'
import { CORRUPT_KEY, STORAGE_KEY, migrate, type PersistedV1 } from './schema'

function pack(stays: Stay[]): PersistedV1 {
  return { version: 1, stays }
}

export function load(storage: Storage = localStorage): Stay[] {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return []
  try {
    return migrate(JSON.parse(raw)).stays
  } catch {
    // Never silently destroy data: keep the unreadable payload aside.
    storage.setItem(CORRUPT_KEY, raw)
    return []
  }
}

export function save(stays: Stay[], storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(pack(stays)))
}

/** Best-effort request to exempt this origin from storage eviction. */
export function requestPersistence(): void {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    void navigator.storage.persist()
  }
}

export function exportJson(stays: Stay[]): string {
  return JSON.stringify(pack(stays), null, 2)
}

/** Parse a backup file. Throws a descriptive Error on invalid content. */
export function importJson(text: string): Stay[] {
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
