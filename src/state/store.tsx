/**
 * One small store for the whole panel.
 *
 * Cached preferences render immediately; the course snapshot loads in the
 * background and everything derived from it is computed, never stored twice.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { faroClient, type CourseSnapshot } from '@/data/client'
import { evaluateFriction } from '@/lib/friction'
import { buildJourney, nextBestAction, recoveryRoute } from '@/lib/journey'
import { readValue, writeValue, clearAll } from './storage'
import type {
  FrictionSignal,
  Journey,
  MentorMessage,
  MentorStyle,
  NextBestAction,
  Purpose,
  RecoveryStep,
} from '@/types'

interface StoreValue {
  loading: boolean
  snapshot: CourseSnapshot | null
  purpose: Purpose | null
  mentorStyle: MentorStyle
  availableMinutes: number
  friction: FrictionSignal | null
  journey: Journey | null
  nextAction: NextBestAction | null
  recovery: RecoveryStep[]
  messages: MentorMessage[]
  setPurpose: (p: Purpose) => void
  setMentorStyle: (s: MentorStyle) => void
  setAvailableMinutes: (m: number) => void
  setMessages: (m: MentorMessage[]) => void
  reset: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<CourseSnapshot | null>(null)
  const [purpose, setPurposeState] = useState<Purpose | null>(null)
  const [mentorStyle, setMentorStyleState] = useState<MentorStyle>('encouraging')
  const [availableMinutes, setAvailableMinutesState] = useState(20)
  const [messages, setMessages] = useState<MentorMessage[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [p, s, m] = await Promise.all([
        readValue<Purpose>('purpose'),
        readValue<MentorStyle>('mentorStyle'),
        readValue<number>('availableMinutes'),
      ])
      if (!alive) return
      if (p) setPurposeState(p)
      if (s) setMentorStyleState(s)
      if (typeof m === 'number') setAvailableMinutesState(m)

      const snap = await faroClient.getCourseSnapshot()
      if (!alive) return
      setSnapshot(snap)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  const setPurpose = useCallback((p: Purpose) => {
    setPurposeState(p)
    void writeValue('purpose', p)
    setAvailableMinutesState(p.weekdayMinutes)
    void writeValue('availableMinutes', p.weekdayMinutes)
  }, [])

  const setMentorStyle = useCallback((s: MentorStyle) => {
    setMentorStyleState(s)
    void writeValue('mentorStyle', s)
  }, [])

  const setAvailableMinutes = useCallback((m: number) => {
    setAvailableMinutesState(m)
    void writeValue('availableMinutes', m)
  }, [])

  const reset = useCallback(() => {
    void clearAll()
    setPurposeState(null)
    setMessages([])
  }, [])

  const friction = useMemo(
    () => (snapshot ? evaluateFriction(snapshot) : null),
    [snapshot],
  )
  const journey = useMemo(
    () => (snapshot && friction ? buildJourney(snapshot, friction) : null),
    [snapshot, friction],
  )
  const nextAction = useMemo(
    () => (journey ? nextBestAction(journey, availableMinutes) : null),
    [journey, availableMinutes],
  )
  const recovery = useMemo(() => (journey ? recoveryRoute(journey) : []), [journey])

  const value: StoreValue = {
    loading,
    snapshot,
    purpose,
    mentorStyle,
    availableMinutes,
    friction,
    journey,
    nextAction,
    recovery,
    messages,
    setPurpose,
    setMentorStyle,
    setAvailableMinutes,
    setMessages,
    reset,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
