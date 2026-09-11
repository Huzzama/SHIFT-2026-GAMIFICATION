/**
 * One small store for the whole panel.
 *
 * Cached preferences render immediately; the course snapshot loads in the
 * background and everything derived from it is computed, never stored twice.
 *
 * Only four things are actually stored: the purpose, two preferences, and the
 * sessions the student completed inside FARO. Momentum, journey, next action,
 * recovery route and achievements are all derived from those - so completing
 * one step moves every screen at once, and nothing can drift out of sync.
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
import { evaluateAchievements } from '@/lib/achievements'
import {
  daysSinceLastActivity,
  evaluateFriction,
  frictionRules,
  pendingCount,
} from '@/lib/friction'
import { buildJourney, nextBestAction, recoveryRoute } from '@/lib/journey'
import { minutesFor } from '@/lib/lifeHappened'
import { applySessions } from '@/lib/sessions'
import { readValue, writeValue, clearAll } from './storage'
import type {
  Achievement,
  FrictionSignal,
  Journey,
  JourneyMilestone,
  LifeState,
  MentorMessage,
  MentorStyle,
  NextBestAction,
  Purpose,
  RecoveryStep,
  StudySession,
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
  sessions: StudySession[]
  achievements: Achievement[]
  lifeState: LifeState | null
  paused: boolean
  /** Days the student had been away when this visit started. */
  awayGap: number
  setPurpose: (p: Purpose) => void
  setMentorStyle: (s: MentorStyle) => void
  setAvailableMinutes: (m: number) => void
  setMessages: (m: MentorMessage[]) => void
  setLifeState: (s: LifeState | null) => void
  setPaused: (p: boolean) => void
  completeMilestone: (m: JourneyMilestone, minutes?: number) => void
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
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [lifeState, setLifeStateInner] = useState<LifeState | null>(null)
  const [paused, setPausedState] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [p, s, m, done, pz] = await Promise.all([
        readValue<Purpose>('purpose'),
        readValue<MentorStyle>('mentorStyle'),
        readValue<number>('availableMinutes'),
        readValue<StudySession[]>('sessions'),
        readValue<boolean>('paused'),
      ])
      if (!alive) return
      if (p) setPurposeState(p)
      if (s) setMentorStyleState(s)
      if (typeof m === 'number') setAvailableMinutesState(m)
      if (Array.isArray(done)) setSessions(done)
      if (typeof pz === 'boolean') setPausedState(pz)

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

  const setPaused = useCallback((p: boolean) => {
    setPausedState(p)
    void writeValue('paused', p)
  }, [])

  const reset = useCallback(() => {
    void clearAll()
    setPurposeState(null)
    setMessages([])
    setSessions([])
    setLifeStateInner(null)
    setPausedState(false)
  }, [])

  /**
   * How long the student had been away when they opened FARO. Read from the
   * raw Canvas snapshot and held steady for the visit, so that finishing a
   * step does not retroactively erase the fact that they came back.
   */
  const awayGap = useMemo(
    () => (snapshot ? daysSinceLastActivity(snapshot) : 0),
    [snapshot],
  )

  /** Canvas, plus what the student has done in FARO since. */
  const effective = useMemo(
    () => (snapshot ? applySessions(snapshot, sessions) : null),
    [snapshot, sessions],
  )

  /**
   * A student opening FARO after a gap is, literally, returning. That is the
   * RECOVERY state - and it ends the moment they complete something, because
   * then they are simply studying again.
   */
  const returning = awayGap >= frictionRules.frictionDays && sessions.length === 0

  const friction = useMemo(
    () => (effective ? evaluateFriction(effective, returning) : null),
    [effective, returning],
  )
  const journey = useMemo(
    () => (effective && friction ? buildJourney(effective, friction) : null),
    [effective, friction],
  )
  const nextAction = useMemo(
    () => (journey ? nextBestAction(journey, availableMinutes) : null),
    [journey, availableMinutes],
  )
  const recovery = useMemo(() => (journey ? recoveryRoute(journey) : []), [journey])

  const achievements = useMemo(
    () =>
      evaluateAchievements({
        sessions,
        journey,
        momentum: friction?.momentum ?? 0,
        awayGap,
      }),
    [sessions, journey, friction, awayGap],
  )

  /**
   * Choosing a life state changes what FARO asks of the student, immediately.
   * It never changes deadlines or academic rules - those are the institution's.
   */
  const setLifeState = useCallback(
    (s: LifeState | null) => {
      setLifeStateInner(s)
      if (!s) return
      setAvailableMinutes(minutesFor(s, availableMinutes))
      if (s === 'need_break') setPaused(true)
      else setPaused(false)
    },
    [availableMinutes, setAvailableMinutes, setPaused],
  )

  /**
   * The student finished a step. Recorded here, felt everywhere: the route
   * advances, momentum recovers, the recovery plan shrinks, and an achievement
   * may fall out of it.
   */
  const completeMilestone = useCallback(
    (m: JourneyMilestone, minutes?: number) => {
      if (!m.assignmentId) return
      setSessions((prev) => {
        if (prev.some((s) => s.milestoneId === m.id)) return prev
        const spent = minutes ?? Math.min(m.estimatedMinutes, availableMinutes)
        const session: StudySession = {
          id: `s-${Date.now()}-${m.id}`,
          milestoneId: m.id,
          assignmentId: m.assignmentId as number,
          title: m.title,
          minutes: spent,
          at: new Date().toISOString(),
          pendingAtStart: effective ? pendingCount(effective) : 0,
          fitAvailableTime: m.estimatedMinutes <= availableMinutes,
        }
        const next = [...prev, session]
        void writeValue('sessions', next)
        return next
      })
      setPausedState(false)
      void writeValue('paused', false)
    },
    [availableMinutes, effective],
  )

  const value: StoreValue = {
    loading,
    snapshot: effective,
    purpose,
    mentorStyle,
    availableMinutes,
    friction,
    journey,
    nextAction,
    recovery,
    messages,
    sessions,
    achievements,
    lifeState,
    paused,
    awayGap,
    setPurpose,
    setMentorStyle,
    setAvailableMinutes,
    setMessages,
    setLifeState,
    setPaused,
    completeMilestone,
    reset,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
