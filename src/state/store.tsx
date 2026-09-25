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
import { faroClient, scenarioClient, type CourseSnapshot } from '@/data/client'
import { detectLang, dict, type Dict } from '@/i18n'
import { evaluateAchievements } from '@/lib/achievements'
import {
  daysSinceLastActivity,
  evaluateFriction,
  frictionRules,
  pendingCount,
} from '@/lib/friction'
import { buildJourney, nextBestAction, recoveryRoute } from '@/lib/journey'
import { minutesFor } from '@/lib/lifeHappened'
import { computePoints, type PointsBreakdown } from '@/lib/points'
import { pickReviewSet, shouldOfferReview } from '@/lib/reviewCards'
import { semesterStatus, type SemesterStatus } from '@/lib/rewards'
import { reviewBank, REVIEW_BANK_COURSE_ID } from '@/data/reviewBank'
import { previousCourses } from '@/data/rewards.mock'
import { learningRhythm, weekRhythm, type RhythmDay } from '@/lib/rhythm'
import { applySessions } from '@/lib/sessions'
import { useCommunityPoints } from './community'
import { readValue, writeValue, clearAll } from './storage'
import type {
  Achievement,
  FrictionSignal,
  Journey,
  JourneyMilestone,
  Lang,
  LifeState,
  MentorMessage,
  MentorStyle,
  NextBestAction,
  Profile,
  Purpose,
  RecoveryStep,
  Redemption,
  ReviewQuestion,
  ReviewRecord,
  RewardTier,
  StudySession,
  WeekPlan,
} from '@/types'

const EMPTY_PROFILE: Profile = {
  name: '',
  photoDataUrl: null,
  bio: '',
  institutionLinked: false,
  updatedAt: null,
}

interface StoreValue {
  loading: boolean
  /** Set when the course snapshot could not be fetched (backend down, token rejected). */
  loadError: string | null
  /** Try the snapshot again after a load error. */
  reload: () => void
  lang: Lang
  /** The active dictionary. Views read copy from here, never from literals. */
  t: Dict
  snapshot: CourseSnapshot | null
  purpose: Purpose | null
  /** Photo/bio/institution-link, shown on the student's own public Community profile. */
  profile: Profile
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
  /** Consecutive active days, ending today. Shown alongside momentum, never instead of it. */
  rhythmDays: number
  /** This week, Monday to Sunday, and which days had learning in them. */
  week: RhythmDay[]
  /** A small plan accepted in the mentor, shown on Home until done or cleared. */
  weekPlan: WeekPlan | null
  setWeekPlan: (p: WeekPlan | null) => void
  /** FARO Points earned in this course, see `lib/points.ts`. */
  points: PointsBreakdown
  /** The semester's reward track: this course plus previous ones, see `lib/rewards.ts`. */
  semester: SemesterStatus
  /** Finished review-card sets. */
  reviews: ReviewRecord[]
  /** The three cards for this return, or [] when there is nothing to review. */
  reviewSet: ReviewQuestion[]
  /** Whether Recovery should offer the cards right now. */
  reviewOffered: boolean
  completeReview: (questionIds: string[], firstTry: number) => void
  redeem: (tier: RewardTier) => void
  setLang: (l: Lang) => void
  setPurpose: (p: Purpose) => void
  setProfile: (p: Profile) => void
  setMentorStyle: (s: MentorStyle) => void
  setAvailableMinutes: (m: number) => void
  setMessages: (m: MentorMessage[]) => void
  setLifeState: (s: LifeState | null) => void
  setPaused: (p: boolean) => void
  completeMilestone: (m: JourneyMilestone, minutes?: number) => void
  /** Wipes everything FARO stored; the app starts again at onboarding. */
  reset: () => void
  /** True while the demo scenario is loaded instead of the configured course. */
  scenario: boolean
  /**
   * Replays the demo return: five days away, twelve days and 4.5 h left,
   * four modules open. Keeps the purpose and preferences, clears what the
   * student did in FARO, and reloads the course from fixtures.
   */
  startScenario: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [lang, setLangState] = useState<Lang>(detectLang)
  const [snapshot, setSnapshot] = useState<CourseSnapshot | null>(null)
  const [purpose, setPurposeState] = useState<Purpose | null>(null)
  const [profile, setProfileState] = useState<Profile>(EMPTY_PROFILE)
  const [mentorStyle, setMentorStyleState] = useState<MentorStyle>('encouraging')
  const [availableMinutes, setAvailableMinutesState] = useState(20)
  const [messages, setMessages] = useState<MentorMessage[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [lifeState, setLifeStateInner] = useState<LifeState | null>(null)
  const [paused, setPausedState] = useState(false)
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [redemption, setRedemption] = useState<Redemption | null>(null)
  const [weekPlan, setWeekPlanState] = useState<WeekPlan | null>(null)
  const [scenario, setScenario] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [p, s, m, done, pz, l, pr, rv, rd, wp, sc] = await Promise.all([
        readValue<Purpose>('purpose'),
        readValue<MentorStyle>('mentorStyle'),
        readValue<number>('availableMinutes'),
        readValue<StudySession[]>('sessions'),
        readValue<boolean>('paused'),
        readValue<Lang>('lang'),
        readValue<Profile>('profile'),
        readValue<ReviewRecord[]>('reviews'),
        readValue<Redemption>('redemption'),
        readValue<WeekPlan>('weekPlan'),
        readValue<boolean>('scenario'),
      ])
      if (!alive) return
      if (l === 'es' || l === 'en') setLangState(l)
      if (p) setPurposeState(p)
      if (s) setMentorStyleState(s)
      if (typeof m === 'number') setAvailableMinutesState(m)
      if (Array.isArray(done)) setSessions(done)
      if (typeof pz === 'boolean') setPausedState(pz)
      if (pr) setProfileState(pr)
      if (Array.isArray(rv)) setReviews(rv)
      if (rd) setRedemption(rd)
      if (wp && Array.isArray(wp.days)) setWeekPlanState(wp)
      setScenario(sc === true)

      try {
        const snap = await (sc === true ? scenarioClient : faroClient).getCourseSnapshot()
        if (!alive) return
        setSnapshot(snap)
        setLoadError(null)
      } catch (err) {
        // The message is for the developer console; the UI shows its own copy.
        console.error('[FARO] course snapshot failed', err)
        if (!alive) return
        setLoadError(err instanceof Error ? err.message : 'unknown')
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [reloadTick])

  const reload = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    setReloadTick((n) => n + 1)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    void writeValue('lang', l)
    // The mentor thread was written in the old language; start it fresh.
    setMessages([])
  }, [])

  const setPurpose = useCallback((p: Purpose) => {
    setPurposeState(p)
    void writeValue('purpose', p)
    setAvailableMinutesState(p.weekdayMinutes)
    void writeValue('availableMinutes', p.weekdayMinutes)
  }, [])

  const setProfile = useCallback((p: Profile) => {
    setProfileState(p)
    void writeValue('profile', p)
  }, [])

  const setWeekPlan = useCallback((p: WeekPlan | null) => {
    setWeekPlanState(p)
    void writeValue('weekPlan', p)
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
    setProfileState(EMPTY_PROFILE)
    setMessages([])
    setSessions([])
    setLifeStateInner(null)
    setPausedState(false)
    setReviews([])
    setRedemption(null)
    setWeekPlanState(null)
    setAvailableMinutesState(20)
    // Back to the configured course, if the demo scenario was loaded.
    if (scenario) {
      setScenario(false)
      setLoading(true)
      setReloadTick((n) => n + 1)
    }
  }, [scenario])

  const startScenario = useCallback(async () => {
    setSessions([])
    setReviews([])
    setRedemption(null)
    setWeekPlanState(null)
    setMessages([])
    setLifeStateInner(null)
    setPausedState(false)
    // Written before the reload reads them back, so nothing old reappears.
    await Promise.all([
      writeValue('sessions', []),
      writeValue('reviews', []),
      writeValue('redemption', null),
      writeValue('weekPlan', null),
      writeValue('paused', false),
      writeValue('scenario', true),
    ])
    setScenario(true)
    setLoading(true)
    setReloadTick((n) => n + 1)
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
    () => (effective ? evaluateFriction(effective, returning, lang) : null),
    [effective, returning, lang],
  )
  const journey = useMemo(
    () => (effective && friction ? buildJourney(effective, friction) : null),
    [effective, friction],
  )
  const nextAction = useMemo(
    () => (journey ? nextBestAction(journey, availableMinutes, lang) : null),
    [journey, availableMinutes, lang],
  )
  const recovery = useMemo(
    () => (journey ? recoveryRoute(journey, lang) : []),
    [journey, lang],
  )

  const achievements = useMemo(
    () =>
      evaluateAchievements({
        sessions,
        journey,
        momentum: friction?.momentum ?? 0,
        awayGap,
        lang,
      }),
    [sessions, journey, friction, awayGap, lang],
  )

  /** Consecutive active days, ending today - Learning Rhythm, see `lib/rhythm.ts`. */
  const rhythmDays = useMemo(() => learningRhythm(sessions), [sessions])
  const week = useMemo(() => weekRhythm(sessions, snapshot?.activity ?? []), [sessions, snapshot])

  /**
   * FARO Points: config-driven, earned from the same real actions above -
   * plus whatever the student earned by helping someone in Community. One
   * balance, two sources.
   */
  const communityPoints = useCommunityPoints()
  const points = useMemo(
    () => computePoints({ sessions, journey, rhythmDays, awayGap, community: communityPoints, reviews }),
    [sessions, journey, rhythmDays, awayGap, communityPoints, reviews],
  )

  const semester = useMemo(
    () =>
      semesterStatus({
        currentCourse: points.total,
        previousCourses: previousCourses.reduce((sum, c) => sum + c.points, 0),
        redemption,
      }),
    [points.total, redemption],
  )

  /**
   * The review cards for this return. Only for the course the bank was
   * written for: a live course with no bank gets no cards, not borrowed ones.
   */
  const reviewSet = useMemo(
    () => (journey && journey.courseId === REVIEW_BANK_COURSE_ID ? pickReviewSet(journey, reviewBank) : []),
    [journey],
  )
  const reviewOffered = shouldOfferReview({
    awayGap,
    frictionDays: frictionRules.frictionDays,
    questions: reviewSet,
    records: reviews,
  })

  const completeReview = useCallback((questionIds: string[], firstTry: number) => {
    setReviews((prev) => {
      const next = [...prev, { id: `r-${Date.now()}`, at: new Date().toISOString(), questionIds, firstTry }]
      void writeValue('reviews', next)
      return next
    })
  }, [])

  /** One redemption per semester. Simulated: nothing leaves the device. */
  const redeem = useCallback(
    (tier: RewardTier) => {
      if (redemption || semester.total < tier.points) return
      const r: Redemption = { tierId: tier.id, mxn: tier.mxn, at: new Date().toISOString() }
      setRedemption(r)
      void writeValue('redemption', r)
    },
    [redemption, semester.total],
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
    loadError,
    reload,
    lang,
    t: dict(lang),
    snapshot: effective,
    purpose,
    profile,
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
    rhythmDays,
    week,
    weekPlan,
    setWeekPlan,
    points,
    semester,
    reviews,
    reviewSet,
    reviewOffered,
    completeReview,
    redeem,
    setLang,
    setPurpose,
    setProfile,
    setMentorStyle,
    setAvailableMinutes,
    setMessages,
    setLifeState,
    setPaused,
    completeMilestone,
    reset,
    scenario,
    startScenario,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
