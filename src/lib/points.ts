/**
 * FARO Points - a configurable layer over real actions.
 *
 * There is no hard-coded amount anywhere below. Every value that decides how
 * many points something is worth lives in `pointsConfig`, so it can be tuned
 * - or replaced by an institution's own economics - without touching the
 * code that awards points. What points are worth in pesos lives in
 * `lib/rewards.ts`.
 *
 * The scale is calibrated to a semester, not to a course: one course
 * finished end to end is worth roughly 2,300-2,800 points, and a semester of
 * about four courses reaches the 10,000-point, $200 MXN reward. See
 * `lib/rewards.ts` for the goal and the catalog.
 *
 * Points come from things a student actually did - an activity finished (in
 * Canvas or in FARO), a module closed, a rhythm kept, a return after time
 * away, a set of review cards completed - never from opening the app or
 * clicking around. That is the same "no badge spam" rule the achievements
 * system holds to.
 */
import { frictionRules } from './friction'
import type { Journey, ReviewRecord, StudySession } from '@/types'

export const pointsConfig = {
  /** Points for each completed activity on the route (Canvas submission or a step finished in FARO). */
  POINTS_PER_ACTIVITY: 50,
  /** Bonus for finishing every step in a module. */
  POINTS_PER_MODULE: 250,
  /** Bonus per Learning Rhythm milestone (see `rhythmMilestoneEvery` below). */
  STREAK_BONUS: 25,
  /** One-time bonus for returning and completing a step after a real gap. */
  COMEBACK_BONUS: 125,
  /** For finishing a set of review cards - finishing, not getting them right first time. */
  REVIEW_SET_BONUS: 75,
}

/** Award a rhythm bonus every N consecutive active days. */
const rhythmMilestoneEvery = 3

export interface PointsBreakdown {
  total: number
  /** Earned in this course. Previous courses of the semester are added in `lib/rewards.ts`. */
  activityCount: number
  fromActivities: number
  moduleCount: number
  fromModules: number
  rhythmMilestones: number
  fromRhythm: number
  comebackEarned: boolean
  fromComebacks: number
  /** Earned in Community: useful answers and completed study rooms. */
  fromCommunity: number
  reviewSets: number
  fromReviews: number
  /** Points earned in the last 7 days through actions taken in FARO. */
  thisWeek: number
}

function modulesCompleted(journey: Journey | null): number {
  if (!journey) return 0
  const byModule = new Map<number, boolean>()
  for (const m of journey.milestones) {
    const doneSoFar = byModule.get(m.moduleId)
    const done = m.status === 'completed'
    byModule.set(m.moduleId, doneSoFar === undefined ? done : doneSoFar && done)
  }
  return [...byModule.values()].filter(Boolean).length
}

const WEEK = 7 * 24 * 60 * 60 * 1000

export function computePoints({
  sessions,
  journey,
  rhythmDays,
  awayGap,
  community = 0,
  reviews = [],
  now = Date.now(),
}: {
  sessions: StudySession[]
  journey: Journey | null
  /** Finished review-card sets. */
  reviews?: ReviewRecord[]
  now?: number
  /** Consecutive active days, from `lib/rhythm.ts`. */
  rhythmDays: number
  /** Days away when this visit started - the same value the friction engine uses. */
  awayGap: number
  /**
   * Points already earned in Community, from `lib/community.ts`. Passed in
   * rather than computed here so the two systems stay independent: points is
   * the only place they meet.
   */
  community?: number
}): PointsBreakdown {
  // Every completed activity counts, whether it was submitted in Canvas
  // before FARO existed or finished inside FARO today: both are real work.
  const activityCount = journey
    ? journey.milestones.filter((m) => m.status === 'completed').length
    : sessions.length
  const fromActivities = activityCount * pointsConfig.POINTS_PER_ACTIVITY

  const moduleCount = modulesCompleted(journey)
  const fromModules = moduleCount * pointsConfig.POINTS_PER_MODULE

  const rhythmMilestones = Math.floor(rhythmDays / rhythmMilestoneEvery)
  const fromRhythm = rhythmMilestones * pointsConfig.STREAK_BONUS

  // A real comeback: the student was away long enough to count as friction,
  // and did at least one thing since. Awarded once per visit, not per step.
  const comebackEarned = sessions.length > 0 && awayGap >= frictionRules.frictionDays
  const fromComebacks = comebackEarned ? pointsConfig.COMEBACK_BONUS : 0

  const reviewSets = reviews.length
  const fromReviews = reviewSets * pointsConfig.REVIEW_SET_BONUS

  // "This week" is what FARO saw happen: steps finished here, review sets,
  // and the comeback bonus if it was earned by one of them.
  const recent = (iso: string) => now - new Date(iso).getTime() <= WEEK
  const recentSessions = sessions.filter((s) => recent(s.at)).length
  const thisWeek =
    recentSessions * pointsConfig.POINTS_PER_ACTIVITY +
    reviews.filter((r) => recent(r.at)).length * pointsConfig.REVIEW_SET_BONUS +
    (comebackEarned && recentSessions > 0 ? pointsConfig.COMEBACK_BONUS : 0)

  return {
    total: fromActivities + fromModules + fromRhythm + fromComebacks + fromReviews + community,
    activityCount,
    fromActivities,
    moduleCount,
    fromModules,
    rhythmMilestones,
    fromRhythm,
    comebackEarned,
    fromComebacks,
    fromCommunity: community,
    reviewSets,
    fromReviews,
    thisWeek,
  }
}
