import { useState, type FormEvent } from 'react'
import { isValidIso, toDayNum } from '../domain/dates'
import type { Stay } from '../domain/types'

export interface StayFormProps {
  initial?: Stay
  onSave: (stay: Omit<Stay, 'id'>) => void
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
    setError(null)
    onSave({ entry, exit, label: label.trim() || undefined })
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
            max={exit || undefined}
            onChange={(e) => setEntry(e.target.value)}
          />
        </label>
        <label>
          Exit
          <input
            type="date"
            required
            value={exit}
            min={entry || undefined}
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
            maxLength={60}
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
