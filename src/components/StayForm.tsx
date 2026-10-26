import { useState, type FormEvent } from 'react'
import { isValidIso, toDayNum } from '../domain/dates'
import {
  MAX_LABEL_LENGTH,
  MAX_RECORDED_STAY_DAYS,
  MAX_SUPPORTED_ISO,
  MIN_SUPPORTED_ISO,
  cleanLabel,
  isSupportedStay,
} from '../domain/limits'
import type { Stay } from '../domain/types'

export interface StayFormProps {
  initial?: Stay
  /** Return a user-facing error to keep the form open, or null on success. */
  onSave: (stay: Omit<Stay, 'id'>) => string | null
  onCancel?: () => void
}

export function StayForm({ initial, onSave, onCancel }: StayFormProps) {
  const [entry, setEntry] = useState(initial?.entry ?? '')
  const [exit, setExit] = useState(initial?.exit ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!isValidIso(entry) || !isValidIso(exit)) {
      setError('Please fill in both dates.')
      return
    }
    if (toDayNum(exit) < toDayNum(entry)) {
      setError('Exit date is before entry date.')
      return
    }
    if (!isSupportedStay(entry, exit)) {
      setError(
        `Use dates between ${MIN_SUPPORTED_ISO} and ${MAX_SUPPORTED_ISO}, with a stay of at most ${MAX_RECORDED_STAY_DAYS} days.`,
      )
      return
    }
    const failure = onSave({ entry, exit, label: cleanLabel(label) })
    if (failure) {
      setError(failure)
      return
    }
    setError(null)
    if (!initial) {
      setEntry('')
      setExit('')
      setLabel('')
    }
  }

  return (
    <form className="stay-form" onSubmit={submit}>
      <div className="stay-form-fields">
        <label>
          Entry
          <input
            type="date"
            required
            value={entry}
            min={MIN_SUPPORTED_ISO}
            max={exit || MAX_SUPPORTED_ISO}
            onChange={(e) => setEntry(e.target.value)}
          />
        </label>
        <label>
          Exit
          <input
            type="date"
            required
            value={exit}
            min={entry || MIN_SUPPORTED_ISO}
            max={MAX_SUPPORTED_ISO}
            onChange={(e) => setExit(e.target.value)}
          />
        </label>
        <label>
          <span>
            Label <span className="muted">(optional)</span>
          </span>
          <input
            type="text"
            placeholder="e.g. Paris trip"
            maxLength={MAX_LABEL_LENGTH}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="stay-form-actions">
        <button type="submit" className="btn btn-primary">
          {initial ? 'Save changes' : 'Add stay'}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
