import { describe, expect, it } from 'vitest'
import { MAX_LABEL_LENGTH, cleanLabel } from './limits'

describe('cleanLabel', () => {
  it('trims and strips unsafe formatting characters', () => {
    expect(cleanLabel('  Paris  ')).toBe('Paris')
    expect(cleanLabel('Paris\u202E')).toBe('Paris')
    expect(cleanLabel('\u0000')).toBeUndefined()
    expect(cleanLabel('   ')).toBeUndefined()
  })

  it('caps the label at the schema limit', () => {
    expect(cleanLabel('x'.repeat(MAX_LABEL_LENGTH + 5))).toHaveLength(MAX_LABEL_LENGTH)
  })
})
