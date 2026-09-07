import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { todayIso, toDayNum } from '../domain/dates'
import {
  computeSummary,
  findHistoricalViolations,
  type Summary,
} from '../domain/schengen'
import { mergedRangesOf } from '../domain/stays'
import type { DayRange, Stay } from '../domain/types'
import { load, requestPersistence, save } from '../storage/staysRepo'

type Action =
  | { type: 'add'; stay: Omit<Stay, 'id'> }
  | { type: 'update'; stay: Stay }
  | { type: 'remove'; id: string }
  | { type: 'replaceAll'; stays: Stay[] }

function reducer(stays: Stay[], action: Action): Stay[] {
  switch (action.type) {
    case 'add':
      return [...stays, { ...action.stay, id: crypto.randomUUID() }]
    case 'update':
      return stays.map((s) => (s.id === action.stay.id ? action.stay : s))
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
  dispatch: (action: Action) => void
}

const StaysContext = createContext<StaysValue | null>(null)

export function StaysProvider({ children }: { children: ReactNode }) {
  const [stays, dispatch] = useReducer(reducer, undefined, () => load())

  useEffect(() => {
    save(stays)
    if (stays.length > 0) requestPersistence()
  }, [stays])

  const today = todayIso()
  const value = useMemo<StaysValue>(() => {
    const mergedRanges = mergedRangesOf(stays)
    return {
      stays,
      mergedRanges,
      summary: computeSummary(mergedRanges, toDayNum(today)),
      violations: findHistoricalViolations(mergedRanges),
      today,
      dispatch,
    }
  }, [stays, today])

  return <StaysContext.Provider value={value}>{children}</StaysContext.Provider>
}

export function useStays(): StaysValue {
  const value = useContext(StaysContext)
  if (!value) throw new Error('useStays must be used inside StaysProvider')
  return value
}
