import { useState } from 'react'
import { toDayNum } from '../domain/dates'
import type { Stay } from '../domain/types'
import { useStays } from '../state/StaysContext'
import { formatDayShort } from '../ui/format'
import { StayForm } from './StayForm'

function overlaps(stay: Stay, others: Stay[]): boolean {
  const start = toDayNum(stay.entry)
  const end = toDayNum(stay.exit)
  return others.some(
    (o) => o.id !== stay.id && toDayNum(o.entry) <= end && start <= toDayNum(o.exit),
  )
}

export function StayList() {
  const { stays, today, dispatch } = useStays()
  const [editingId, setEditingId] = useState<string | null>(null)
  const todayNum = toDayNum(today)

  const sorted = [...stays].sort((a, b) => toDayNum(b.entry) - toDayNum(a.entry))
  const planned = sorted.filter((s) => toDayNum(s.entry) > todayNum)
  const spent = sorted.filter((s) => toDayNum(s.entry) <= todayNum)

  const renderRow = (stay: Stay, isPlanned: boolean) => {
    const start = toDayNum(stay.entry)
    const end = toDayNum(stay.exit)
    const days = end - start + 1
    if (editingId === stay.id) {
      return (
        <li key={stay.id} className="stay-row stay-row-editing">
          <StayForm
            initial={stay}
            onSave={(updated) => {
              dispatch({ type: 'update', stay: { ...updated, id: stay.id } })
              setEditingId(null)
            }}
            onCancel={() => setEditingId(null)}
          />
        </li>
      )
    }
    return (
      <li key={stay.id} className="stay-row">
        <div className="stay-info">
          <span className="stay-dates">
            {formatDayShort(start)} → {formatDayShort(end)}
          </span>
          <span className="muted">
            {days} {days === 1 ? 'day' : 'days'}
            {stay.label ? ` · ${stay.label}` : ''}
            {overlaps(stay, stays) ? ' · overlaps another stay' : ''}
          </span>
        </div>
        <div className="stay-actions">
          {isPlanned && <span className="badge">Planned</span>}
          <button className="btn" onClick={() => setEditingId(stay.id)}>
            Edit
          </button>
          <button
            className="btn btn-danger"
            onClick={() => dispatch({ type: 'remove', id: stay.id })}
          >
            Delete
          </button>
        </div>
      </li>
    )
  }

  return (
    <section aria-label="Your stays">
      <h2>Your stays</h2>
      {sorted.length === 0 && (
        <p className="muted">
          No stays recorded yet. Add each period you spent in the Schengen area below.
        </p>
      )}
      {planned.length > 0 && (
        <>
          <h3 className="stay-group-title">Planned</h3>
          <ul className="stay-list">{planned.map((s) => renderRow(s, true))}</ul>
        </>
      )}
      {planned.length > 0 && spent.length > 0 && (
        <h3 className="stay-group-title">Past and current</h3>
      )}
      <ul className="stay-list">{spent.map((s) => renderRow(s, false))}</ul>
      <h3 className="add-stay-title">Add a stay</h3>
      <StayForm onSave={(stay) => dispatch({ type: 'add', stay })} />
    </section>
  )
}
