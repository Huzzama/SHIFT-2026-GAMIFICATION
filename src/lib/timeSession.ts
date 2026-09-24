/**
 * "How much time do you have?" — turning a number of minutes into a session.
 *
 * Used by Home's time picker, the mentor's Focus mode and weekend planning,
 * so the three always agree. The rules are deliberately plain:
 *
 *  1. Work in route order, overdue first — the same order as the journey.
 *  2. Returning after a gap and the review cards are available? Open with
 *     them (three questions, about three minutes): the cheapest way back in.
 *  3. Take steps in order while they fit. Never skip ahead to a later step
 *     just because it is shorter: a module's quiz does not come before the
 *     exercise it checks.
 *  4. Nothing fits? Offer the first open step anyway, as "the first N
 *     minutes of it" — a short session beats no session.
 *
 * Nothing here decides for the student; it proposes. Minutes are FARO's
 * estimates (Canvas has no duration field), and the UI says "about".
 */
import type { DayPlan, Journey, JourneyMilestone } from '@/types'

export const sessionRules = {
  REVIEW_MINUTES: 3,
  /** The "30+" chip plans for this much. */
  OPEN_ENDED_MINUTES: 45,
} as const

export type SessionItem =
  | { kind: 'review'; minutes: number }
  | { kind: 'step'; minutes: number; milestone: JourneyMilestone }
  | { kind: 'partial'; minutes: number; milestone: JourneyMilestone }

/** Open steps in the order FARO would do them: missed first, then the route. */
export function openSteps(journey: Journey): JourneyMilestone[] {
  const open = journey.milestones.filter((m) => m.status === 'missed' || m.status === 'current' || m.status === 'upcoming')
  return [...open.filter((m) => m.status === 'missed'), ...open.filter((m) => m.status !== 'missed')]
}

export function buildTimeSession(
  journey: Journey,
  minutes: number,
  opts: { reviewAvailable?: boolean } = {},
): SessionItem[] {
  let left = minutes
  const items: SessionItem[] = []

  if (opts.reviewAvailable && left >= sessionRules.REVIEW_MINUTES) {
    items.push({ kind: 'review', minutes: sessionRules.REVIEW_MINUTES })
    left -= sessionRules.REVIEW_MINUTES
  }

  for (const m of openSteps(journey)) {
    if (m.estimatedMinutes > left) break
    items.push({ kind: 'step', minutes: m.estimatedMinutes, milestone: m })
    left -= m.estimatedMinutes
  }

  if (!items.some((i) => i.kind !== 'review')) {
    const first = openSteps(journey)[0]
    if (first && left >= 5) items.push({ kind: 'partial', minutes: left, milestone: first })
  }

  return items
}

export const sessionMinutes = (items: SessionItem[]) => items.reduce((sum, i) => sum + i.minutes, 0)

/**
 * A few days of study from what the student says they have, e.g. Saturday
 * 60 and Sunday 45. Steps go in route order, never repeated across days,
 * and a day stops at the first step that does not fit — the plan stays
 * smaller than the time, on purpose. A step longer than a whole day's
 * budget still gets that day rather than silently disappearing.
 */
export function planDays(journey: Journey, days: { label: string; minutes: number }[]): DayPlan[] {
  const queue = [...openSteps(journey)]
  return days.map(({ label, minutes }) => {
    const plan: DayPlan = { label, minutes, items: [] }
    if (minutes <= 0) return plan
    let left = minutes
    while (queue.length > 0) {
      const m = queue[0]
      if (m.estimatedMinutes > left && plan.items.length > 0) break
      plan.items.push({ milestoneId: m.id, title: m.title, minutes: m.estimatedMinutes })
      left -= m.estimatedMinutes
      queue.shift()
      if (left <= 0) break
    }
    return plan
  })
}
