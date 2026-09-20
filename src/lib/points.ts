/**
 * FARO Points - a configurable layer over real actions, not a currency yet.
 *
 * There is no hard-coded conversion rate anywhere below. Every value that
 * decides how many points something is worth lives in `pointsConfig`, so it
 * can be tuned - or replaced by an institution's own economics - without
 * touching the code that awards points. `REWARD_REDEMPTION_RATE` is not used
 * yet: the catalog and redemption flow are deliberately deferred, and this is
 * only the config layer they will read from.
 *
 * Points come from things a student actually did (`sessions`), never from
 * opening the app or clicking around - that is the same "no badge spam" rule
 * the achievements system holds to.
 */
import { frictionRules } from './friction'
import type { Journey, StudySession } from '@/types'

export const pointsConfig = {
  /** Points for completing one step (one FARO study session). */
  POINTS_PER_ACTIVITY: 10,
  /** Bonus for finishing every step in a module. */
  POINTS_PER_MODULE: 50,
  /** Bonus per Learning Rhythm milestone (see `rhythmMilestoneEvery` below). */
  STREAK_BONUS: 5,
  /** One-time bonus for returning and completing a step after a real gap. */
  COMEBACK_BONUS: 25,
  /**
   * Points needed per redemption unit in a future rewards catalog. Not read
   * anywhere yet - the catalog itself is a later phase - but it lives here so
   * that phase starts from a configurable rate instead of inventing one.
   */
  REWARD_REDEMPTION_RATE: 100,
}

/** Award a rhythm bonus every N consecutive active days. */
const rhythmMilestoneEvery = 3

export interface PointsBreakdown {
  total: number
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

export function computePoints({
  sessions,
  journey,
  rhythmDays,
  awayGap,
  community = 0,
}: {
  sessions: StudySession[]
  journey: Journey | null
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
  const activityCount = sessions.length
  const fromActivities = activityCount * pointsConfig.POINTS_PER_ACTIVITY

  const moduleCount = modulesCompleted(journey)
  const fromModules = moduleCount * pointsConfig.POINTS_PER_MODULE

  const rhythmMilestones = Math.floor(rhythmDays / rhythmMilestoneEvery)
  const fromRhythm = rhythmMilestones * pointsConfig.STREAK_BONUS

  // A real comeback: the student was away long enough to count as friction,
  // and did at least one thing since. Awarded once per visit, not per step.
  const comebackEarned = activityCount > 0 && awayGap >= frictionRules.frictionDays
  const fromComebacks = comebackEarned ? pointsConfig.COMEBACK_BONUS : 0

  return {
    total: fromActivities + fromModules + fromRhythm + fromComebacks + community,
    activityCount,
    fromActivities,
    moduleCount,
    fromModules,
    rhythmMilestones,
    fromRhythm,
    comebackEarned,
    fromComebacks,
    fromCommunity: community,
  }
}
