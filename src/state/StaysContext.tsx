import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { todayIso, toDayNum } from '../domain/dates'
import {
  computeSummary,
  findHistoricalViolations,
  type Summary,
} from '../domain/schengen'
import { mergeStayInto, mergedRangesOf } from '../domain/stays'
import type { DayRange, Stay } from '../domain/types'
import { exportJson, load, requestPersistence, save } from '../storage/staysRepo'
import { STORAGE_KEY } from '../storage/schema'

type Action =
  | { type: 'add'; stay: Omit<Stay, 'id'> }
  | { type: 'update'; stay: Stay }
  | { type: 'remove'; id: string }
  | { type: 'replaceAll'; stays: Stay[] }

function reducer(stays: Stay[], action: Action): Stay[] {
  switch (action.type) {
    case 'add':
      // mergeStayInto keeps the invariant that no day belongs to two stays.
      return mergeStayInto(stays, { ...action.stay, id: crypto.randomUUID() })
    case 'update':
      return mergeStayInto(
        stays.filter((s) => s.id !== action.stay.id),
        action.stay,
      )
    case 'remove':
      return stays.filter((s) => s.id !== action.id)
    case 'replaceAll':
      return action.stays
  }
}

interface StaysValue {
  stays: Stay[]
  mergedRanges: DayRange[]
  summary: Summary
  violations: ReturnType<typeof findHistoricalViolations>
  today: string
  /** True when the latest write to on-device storage was refused. */
  saveFailed: boolean
  dispatch: (action: Action) => void
}

const StaysContext = createContext<StaysValue | null>(null)

export function StaysProvider({ children }: { children: ReactNode }) {
  const [stays, dispatch] = useReducer(reducer, undefined, () => load())
  const [saveFailed, setSaveFailed] = useState(false)
  // Signature of the last payload this tab read or wrote, and a flag that
  // suppresses writing a remote change straight back (which would ping-pong
  // between tabs).
  const lastSeen = useRef<string | null>(null)
  const applyingRemote = useRef(false)

  useEffect(() => {
    if (applyingRemote.current) {
      applyingRemote.current = false
      return
    }
    const saved = save(stays)
    if (saved) lastSeen.current = exportJson(stays)
    // Storage is an external system: the write result is only known here.
    // oxlint-disable-next-line react/set-state-in-effect
    setSaveFailed(!saved)
    if (saved && stays.length > 0) requestPersistence()
  }, [stays])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      // Read the live value rather than e.newValue: a queued event can carry
      // an older payload than the one currently stored.
      const incoming = load()
      const signature = exportJson(incoming)
      if (signature === lastSeen.current) return
      lastSeen.current = signature
      applyingRemote.current = true
      dispatch({ type: 'replaceAll', stays: incoming })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Today is state, not a render-time read: an app left open overnight (or
  // restored from bfcache) must roll its window and summary at midnight.
  const [today, setToday] = useState(todayIso)
  useEffect(() => {
    let timer: number | undefined
    const refresh = () => {
      const next = todayIso()
      setToday((previous) => (previous === next ? previous : next))
      schedule()
    }
    const schedule = () => {
      window.clearTimeout(timer)
      const now = new Date()
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      ).getTime()
      // A small margin avoids firing a hair before the local date changes.
      timer = window.setTimeout(refresh, Math.max(1000, midnight - now.getTime() + 1000))
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const value = useMemo<StaysValue>(() => {
    const mergedRanges = mergedRangesOf(stays)
    return {
      stays,
      mergedRanges,
      summary: computeSummary(mergedRanges, toDayNum(today)),
      violations: findHistoricalViolations(mergedRanges),
      today,
      saveFailed,
      dispatch,
    }
  }, [stays, today, saveFailed])

  return <StaysContext.Provider value={value}>{children}</StaysContext.Provider>
}

export function useStays(): StaysValue {
  const value = useContext(StaysContext)
  if (!value) throw new Error('useStays must be used inside StaysProvider')
  return value
}
