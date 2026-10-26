import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MAX_LABEL_LENGTH, cleanLabel } from '../../domain/limits'
import type { DayRange } from '../../domain/types'
import { formatDay } from '../../ui/format'

export interface ConfirmStayDialogProps {
  range: DayRange | null
  todayNum: number
  /** Return a user-facing error to keep the dialog open, or null on success. */
  onConfirm: (label?: string) => string | null
  onCancel: () => void
}

export function ConfirmStayDialog({ range, todayNum, onConfirm, onCancel }: ConfirmStayDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (range && !dialog.open) {
      setLabel('')
      setError(null)
      dialog.showModal()
    }
    if (!range && dialog.open) dialog.close()
  }, [range])

  if (!range) return <dialog ref={ref} className="confirm-dialog" />

  const days = range.end - range.start + 1
  const planned = range.start > todayNum

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const failure = onConfirm(cleanLabel(label))
    if (failure) {
      setError(failure)
      return
    }
    setError(null)
  }

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-stay-title"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current) onCancel()
      }}
    >
      <form onSubmit={submit}>
        <h2 id="confirm-stay-title" className="confirm-title">
          {planned ? 'Add this planned stay?' : 'Add this stay?'}
        </h2>
        <p className="confirm-range">
          {formatDay(range.start)}
          <span className="confirm-arrow" aria-hidden="true">
            →
          </span>
          {formatDay(range.end)}
        </p>
        <p className="confirm-days">
          {days} {days === 1 ? 'day' : 'days'}
          {planned && <span className="badge">Planned</span>}
        </p>
        <label className="confirm-label">
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
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" autoFocus>
            Add stay
          </button>
        </div>
      </form>
    </dialog>
  )
}
