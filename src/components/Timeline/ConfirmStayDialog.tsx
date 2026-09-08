import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { DayRange } from '../../domain/types'
import { formatDay } from '../../ui/format'

export interface ConfirmStayDialogProps {
  range: DayRange | null
  todayNum: number
  onConfirm: (label?: string) => void
  onCancel: () => void
}

export function ConfirmStayDialog({ range, todayNum, onConfirm, onCancel }: ConfirmStayDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (range && !dialog.open) {
      setLabel('')
      dialog.showModal()
    }
    if (!range && dialog.open) dialog.close()
  }, [range])

  if (!range) return <dialog ref={ref} className="confirm-dialog" />

  const days = range.end - range.start + 1
  const planned = range.start > todayNum

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onConfirm(label.trim() || undefined)
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
            maxLength={60}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
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
