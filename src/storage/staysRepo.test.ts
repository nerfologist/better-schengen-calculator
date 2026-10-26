import { describe, expect, it } from 'vitest'
import { MAX_IMPORT_BYTES, MAX_LABEL_LENGTH, MAX_STAYS } from '../domain/limits'
import type { Stay } from '../domain/types'
import { CORRUPT_KEY, PLAN_KEYS, STORAGE_KEY } from './schema'
import { clearAllData, exportJson, importJson, load, save } from './staysRepo'

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
    expect(save(stays, storage)).toBe(true)
    expect(load(storage)).toEqual(stays)
  })

  it('reports a failed save without throwing', () => {
    const storage = memoryStorage()
    storage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(save(stays, storage)).toBe(false)
  })

  it('refuses to persist data that the schema would reject on load', () => {
    const storage = memoryStorage()
    const tooLong: Stay[] = [
      { id: 'x', entry: '2026-01-01', exit: '2028-01-01' },
    ]
    expect(save(tooLong, storage)).toBe(false)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('survives storage access being blocked', () => {
    const blockedRead = memoryStorage()
    blockedRead.getItem = () => {
      throw new Error('SecurityError')
    }
    expect(load(blockedRead)).toEqual([])

    const blockedQuarantine = memoryStorage()
    blockedQuarantine.getItem = () => '{broken json'
    blockedQuarantine.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(load(blockedQuarantine)).toEqual([])
  })

  it('never throws when localStorage is unavailable', () => {
    expect(save(stays, null)).toBe(false)
    expect(load(null)).toEqual([])
    expect(clearAllData(null)).toBe(false)
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

  it('clears stays, quarantined data, and planning inputs', () => {
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, '{"version":1,"stays":[]}')
    storage.setItem(CORRUPT_KEY, 'broken')
    storage.setItem(PLAN_KEYS.maxEntry, '2026-01-01')
    expect(clearAllData(storage)).toBe(true)
    expect(storage.length).toBe(0)
  })

  it('import throws descriptive errors', () => {
    expect(() => importJson('not json')).toThrow(/valid JSON/)
    expect(() => importJson('{"version":99,"stays":[]}')).toThrow(/version/)
    expect(() =>
      importJson(JSON.stringify({ version: 1, stays: [{ id: 'x', entry: '2026-01-10', exit: '2026-01-01' }] })),
    ).toThrow(/valid backup/)
  })

  it('rejects backups larger than the import limit', () => {
    expect(() => importJson('x'.repeat(MAX_IMPORT_BYTES + 1))).toThrow(/too large/)
  })

  it('rejects too many stays', () => {
    const many = Array.from({ length: MAX_STAYS + 1 }, (_, i) => ({
      id: `s${i}`,
      entry: '2026-01-01',
      exit: '2026-01-01',
    }))
    expect(() => importJson(JSON.stringify({ version: 1, stays: many }))).toThrow(
      /valid backup/,
    )
  })

  it('rejects duplicate stay ids', () => {
    const duplicate = [
      { id: 'same', entry: '2026-01-01', exit: '2026-01-01' },
      { id: 'same', entry: '2026-02-01', exit: '2026-02-01' },
    ]
    expect(() => importJson(JSON.stringify({ version: 1, stays: duplicate }))).toThrow(
      /Duplicate stay id/,
    )
  })

  it('rejects dates outside the supported range', () => {
    for (const [entry, exit] of [
      ['1899-12-31', '1900-01-01'],
      ['2100-12-31', '2101-01-01'],
    ]) {
      expect(() =>
        importJson(JSON.stringify({ version: 1, stays: [{ id: 'x', entry, exit }] })),
      ).toThrow(/valid backup/)
    }
  })

  it('rejects stays longer than the supported maximum', () => {
    expect(() =>
      importJson(
        JSON.stringify({
          version: 1,
          stays: [{ id: 'x', entry: '2026-01-01', exit: '2028-01-01' }],
        }),
      ),
    ).toThrow(/valid backup/)
  })

  it('accepts a stay at the maximum length', () => {
    expect(
      importJson(
        JSON.stringify({
          version: 1,
          stays: [{ id: 'x', entry: '2026-01-01', exit: '2027-12-31' }],
        }),
      ),
    ).toHaveLength(1)
  })

  it('rejects oversized or unsafe labels', () => {
    const base = { id: 'x', entry: '2026-01-01', exit: '2026-01-01' }
    for (const label of ['x'.repeat(MAX_LABEL_LENGTH + 1), 'Paris\u202E']) {
      expect(() =>
        importJson(JSON.stringify({ version: 1, stays: [{ ...base, label }] })),
      ).toThrow(/valid backup/)
    }
    expect(
      importJson(
        JSON.stringify({
          version: 1,
          stays: [{ ...base, label: 'x'.repeat(MAX_LABEL_LENGTH) }],
        }),
      ),
    ).toHaveLength(1)
  })
})
