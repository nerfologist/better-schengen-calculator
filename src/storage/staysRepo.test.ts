import { describe, expect, it } from 'vitest'
import type { Stay } from '../domain/types'
import { CORRUPT_KEY, STORAGE_KEY } from './schema'
import { exportJson, importJson, load, save } from './staysRepo'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  }
}

const stays: Stay[] = [
  { id: 'a', entry: '2026-01-01', exit: '2026-01-10', label: 'Paris' },
  { id: 'b', entry: '2026-04-01', exit: '2026-05-30' },
]

describe('staysRepo', () => {
  it('round-trips stays through save/load', () => {
    const storage = memoryStorage()
    save(stays, storage)
    expect(load(storage)).toEqual(stays)
  })

  it('returns empty on first run', () => {
    expect(load(memoryStorage())).toEqual([])
  })

  it('quarantines corrupt data instead of destroying it', () => {
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, '{broken json')
    expect(load(storage)).toEqual([])
    expect(storage.getItem(CORRUPT_KEY)).toBe('{broken json')
  })

  it('rejects structurally invalid stored data', () => {
    const storage = memoryStorage()
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, stays: [{ id: 'x', entry: 'nope', exit: '2026-01-01' }] }),
    )
    expect(load(storage)).toEqual([])
    expect(storage.getItem(CORRUPT_KEY)).not.toBeNull()
  })

  it('round-trips through export/import', () => {
    expect(importJson(exportJson(stays))).toEqual(stays)
  })

  it('import throws descriptive errors', () => {
    expect(() => importJson('not json')).toThrow(/valid JSON/)
    expect(() => importJson('{"version":99,"stays":[]}')).toThrow(/version/)
    expect(() =>
      importJson(JSON.stringify({ version: 1, stays: [{ id: 'x', entry: '2026-01-10', exit: '2026-01-01' }] })),
    ).toThrow(/valid backup/)
  })
})
