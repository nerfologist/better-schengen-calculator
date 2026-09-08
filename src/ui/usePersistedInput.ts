import { useState } from 'react'

/**
 * A string input mirrored to localStorage so planning-tool inputs survive a
 * reload. Storage failures (private mode, blocked site data) degrade to plain
 * in-memory state.
 */
export function usePersistedInput(storageKey: string): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) ?? ''
    } catch {
      return ''
    }
  })

  const set = (next: string) => {
    setValue(next)
    try {
      if (next) localStorage.setItem(storageKey, next)
      else localStorage.removeItem(storageKey)
    } catch {
      // In-memory state still works; persistence is best-effort.
    }
  }

  return [value, set]
}
