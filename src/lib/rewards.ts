/**
 * Rewards - what FARO Points are for.
 *
 * One reward per semester, up to $200 MXN, along one track:
 *
 *    2,500 pts → $50     5,000 pts → $100     10,000 pts → $200
 *
 * Tiers are thresholds on the semester's points, not prices. Reaching $100
 * does not spend anything; it unlocks the option. The student chooses when
 * to redeem, and redeeming closes the semester's reward at that tier - so
 * cashing $100 early is a real decision, stated plainly on screen, rather
 * than a trap that quietly costs them the $200.
 *
 * Why a single track and not a shop: a shop makes points feel like money to
 * be spent, and spending feels like losing progress. A track keeps every
 * point pointed at the same destination, which is the course, not the
 * catalog.
 *
 * Everything here is simulated in the prototype - there is no payment
 * provider and no institution has funded it. The screen says so.
 */
import { pointsConfig } from './points'
import type { Journey, Redemption, RewardTier } from '@/types'

export const rewardsConfig = {
  /** Semester goal, in points. Reaching it unlocks the top tier. */
  SEMESTER_GOAL: 10_000,
  /** The most a student can receive in one semester. */
  SEMESTER_CAP_MXN: 200,
}

export const rewardTiers: RewardTier[] = [
  { id: 'mxn-50', mxn: 50, points: 2_500 },
  { id: 'mxn-100', mxn: 100, points: 5_000 },
  { id: 'mxn-200', mxn: 200, points: rewardsConfig.SEMESTER_GOAL },
]

export interface SemesterStatus {
  total: number
  goal: number
  /** 0-100, capped. */
  percent: number
  /** Highest tier reached, or null. */
  reached: RewardTier | null
  /** Next tier not yet reached, or null when the goal is met. */
  next: RewardTier | null
  /** Points still needed for `next`. */
  toNext: number
  redemption: Redemption | null
}

export function semesterStatus(args: {
  currentCourse: number
  previousCourses: number
  redemption: Redemption | null
}): SemesterStatus {
  const total = args.currentCourse + args.previousCourses
  const goal = rewardsConfig.SEMESTER_GOAL
  const reachedTiers = rewardTiers.filter((t) => total >= t.points)
  const next = rewardTiers.find((t) => total < t.points) ?? null
  return {
    total,
    goal,
    percent: Math.min(100, Math.floor((total / goal) * 100)),
    reached: reachedTiers[reachedTiers.length - 1] ?? null,
    next,
    toNext: next ? next.points - total : 0,
    redemption: args.redemption,
  }
}

/** A tier can be redeemed when it is reached and nothing was redeemed this semester. */
export function canRedeem(tier: RewardTier, status: SemesterStatus): boolean {
  return status.total >= tier.points && status.redemption === null
}

/**
 * What finishing the current course is still worth, counting only the
 * guaranteed parts: the remaining activities and the modules they close.
 * Bonuses (rhythm, comeback, review cards, community) come on top, so the
 * number shown is "at least".
 */
export function remainingCoursePoints(journey: Journey | null): number {
  if (!journey) return 0
  const open = journey.milestones.filter((m) => m.status !== 'completed')
  const openModules = new Set(open.map((m) => m.moduleId)).size
  return open.length * pointsConfig.POINTS_PER_ACTIVITY + openModules * pointsConfig.POINTS_PER_MODULE
}
