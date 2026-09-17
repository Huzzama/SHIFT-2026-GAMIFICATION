/**
 * Friction Engine - v1, transparent rules.
 *
 * These thresholds are prototype assumptions, not validated science. They live
 * in one exported object so they stay configurable and can later be replaced
 * by a data-driven model without touching the callers.
 */
import type { CourseSnapshot } from '@/data/client'
import { dict } from '@/i18n'
import type { FrictionSignal, FrictionState, Lang } from '@/types'

export const frictionRules = {
  frictionDays: 3,
  disconnectionDays: 7,
  overwhelmPendingCount: 4,
  /** Days of inactivity that take momentum from 100 to 0. */
  momentumDecayWindow: 14,
  /** Momentum never falls below this: progress is never destroyed. */
  momentumFloor: 20,
}

const DAY = 24 * 60 * 60 * 1000

export function daysSinceLastActivity(snapshot: CourseSnapshot): number {
  const latest = snapshot.activity
    .map((e) => new Date(e.at).getTime())
    .sort((a, b) => b - a)[0]
  if (!latest) return frictionRules.disconnectionDays
  return Math.floor((Date.now() - latest) / DAY)
}

export function pendingCount(snapshot: CourseSnapshot): number {
  const now = Date.now()
  return snapshot.assignments.filter(
    (a) => !a.submission && a.due_at !== null && new Date(a.due_at).getTime() < now,
  ).length
}

/**
 * Momentum is connection to learning, not a streak. One missed day costs a
 * little; nothing ever resets it to zero, and it is floored so a returning
 * student never sees a wiped slate.
 */
export function momentumFor(days: number, pending: number): number {
  const decay = Math.min(1, days / frictionRules.momentumDecayWindow)
  const load = Math.min(1, pending / 8) * 0.2
  const raw = (1 - decay) * 100 - load * 100
  return Math.max(frictionRules.momentumFloor, Math.round(raw))
}

function stateFor(days: number, pending: number, returning: boolean): FrictionState {
  if (returning) return 'RECOVERY'
  if (days >= frictionRules.disconnectionDays) return 'DISCONNECTION'
  if (pending >= frictionRules.overwhelmPendingCount && days >= frictionRules.frictionDays)
    return 'POSSIBLE_OVERWHELM'
  if (days >= frictionRules.frictionDays) return 'FRICTION'
  return 'FLOWING'
}

export function evaluateFriction(
  snapshot: CourseSnapshot,
  /** True when the student is opening FARO after a period away. */
  returningFromAway = false,
  lang: Lang = 'es',
): FrictionSignal {
  const days = daysSinceLastActivity(snapshot)
  const pending = pendingCount(snapshot)
  const state = stateFor(days, pending, returningFromAway)
  return {
    state,
    daysSinceActivity: days,
    pendingCount: pending,
    momentum: momentumFor(days, pending),
    // Student-facing wording. Never a risk score, never a count of what is late.
    headline: dict(lang).friction[state],
  }
}
