/**
 * Recovery Planner — deterministic, explainable, and willing to say no.
 *
 * This is the engine behind "You can still finish". Every number it produces
 * can be recomputed by hand from the snapshot, which is the point: the
 * feasibility verdict is the one thing in FARO that must never come from a
 * language model. An LLM can later explain, soften or personalise what is
 * decided here, but it does not get to decide it.
 *
 * Three rules govern the whole file:
 *
 *  1. Never promise. If the remaining work does not fit the days that are
 *     left, `feasibility` returns `not_realistic` and the UI says so plainly.
 *  2. Never invent. Missing a deadline or a rhythm produces `unknown`, not a
 *     guess dressed up as data.
 *  3. Never silently drop work. Anything that cannot be scheduled before the
 *     deadline comes back in `plan.overflow` so the student sees it.
 */
import type {
  FeasibilityCheck,
  FeasibilityState,
  Journey,
  JourneyMilestone,
  PlanDay,
  PlanItem,
  RecoveryPlan,
  RemainingWork,
  RouteStrategy,
  StrategyId,
  StudyProfile,
} from '@/types'
import type { CourseSnapshot } from '@/data/client'

const DAY = 24 * 60 * 60 * 1000

/** Rounded to the nearest 5 minutes: a plan that says "37 min/day" is theatre. */
const round5 = (m: number) => Math.max(10, Math.round(m / 5) * 5)

/**
 * Everything still owed before the course closes.
 *
 * Locked modules count. They are not available *yet*, but they are work the
 * student must still fit into the same calendar, and a feasibility check that
 * quietly ignored them would be exactly the reassuring lie this file exists to
 * avoid. The ordering in `prioritise` keeps them where they belong - behind
 * the work that unlocks them.
 */
const isRemaining = (m: JourneyMilestone) => m.status !== 'completed'

/* ------------------------------------------------------------- situation */

export function remainingWork(
  snapshot: CourseSnapshot,
  journey: Journey,
): RemainingWork {
  const open = journey.milestones.filter(isRemaining)
  const deadline = snapshot.course.end_at
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / DAY))
    : 0

  return {
    activities: open.length,
    minutes: open.reduce((sum, m) => sum + m.estimatedMinutes, 0),
    modules: new Set(open.map((m) => m.moduleId)).size,
    daysLeft,
    deadline,
  }
}

/**
 * What this student can sustain in a day.
 *
 * Their stated time wins, because they are the authority on their own week.
 * The measured rhythm is the fallback, and it is spread across the calendar:
 * someone who studies 35 minutes four days a week has 20 minutes a day, not
 * 35 - planning against the session length is how plans quietly fail.
 */
export function capacityFor(
  statedMinutes: number | null,
  profile: StudyProfile | undefined,
): number {
  if (statedMinutes && statedMinutes > 0) return statedMinutes
  if (profile) {
    return round5((profile.averageSessionMinutes * profile.daysPerWeek) / 7)
  }
  return 0
}

/** The measured rhythm alone, for the "why" panel. 0 when unknown. */
export function rhythmDaily(profile: StudyProfile | undefined): number {
  if (!profile) return 0
  return round5((profile.averageSessionMinutes * profile.daysPerWeek) / 7)
}

/* ----------------------------------------------------------- feasibility */

/**
 * Thresholds are prototype assumptions, not validated science. They live here
 * so they stay configurable and reviewable.
 */
export const feasibilityRules = {
  /** At or under this share of capacity, the route is comfortable. */
  comfortableLoad: 0.85,
  /** Up to this, still reachable by stretching a little. Past it, say no. */
  stretchLoad: 1.4,
}

export function feasibility(
  work: RemainingWork,
  capacityMinutes: number,
): FeasibilityCheck {
  const base: Omit<FeasibilityCheck, 'state'> = {
    requiredDailyMinutes: 0,
    capacityMinutes,
    load: 0,
  }

  // Nothing left to schedule: finished, not "feasible".
  if (work.activities === 0) return { ...base, state: 'comfortable' }

  // No deadline, no days, or no idea what the student can give: do not guess.
  if (!work.deadline || work.daysLeft <= 0 || capacityMinutes <= 0) {
    return { ...base, state: 'unknown' }
  }

  const required = work.minutes / work.daysLeft
  const load = required / capacityMinutes

  let state: FeasibilityState = 'not_realistic'
  if (load <= feasibilityRules.comfortableLoad) state = 'comfortable'
  else if (load <= feasibilityRules.stretchLoad) state = 'tight'

  return {
    state,
    requiredDailyMinutes: round5(required),
    capacityMinutes,
    load,
  }
}

/* ------------------------------------------------------------ strategies */

const PACE: Record<StrategyId, number> = {
  comfortable: 1,
  balanced: 1.35,
  intensive: 2,
}

/**
 * Three paces over the same work — never "good, better, best".
 *
 * Each one is described by what it actually produces (days needed, slack
 * before the deadline), computed here rather than asserted in copy. At most
 * one carries `suggested`, and only when there is a real reason: it is the
 * feasible pace closest to what this student already sustains.
 */
export function strategies(
  work: RemainingWork,
  capacityMinutes: number,
): RouteStrategy[] {
  if (work.activities === 0 || work.daysLeft <= 0) return []

  const required = work.minutes / work.daysLeft

  const list: RouteStrategy[] = (Object.keys(PACE) as StrategyId[]).map((id) => {
    const dailyMinutes = round5(required * PACE[id])
    const days = Math.max(1, Math.ceil(work.minutes / dailyMinutes))
    return {
      id,
      dailyMinutes,
      days,
      buffer: work.daysLeft - days,
      feasible: days <= work.daysLeft,
      suggested: false,
    }
  })

  // Closest feasible pace to what the student actually does. No capacity
  // figure means no justification, and therefore no suggestion.
  if (capacityMinutes > 0) {
    const feasible = list.filter((s) => s.feasible)
    const best = feasible.sort(
      (a, b) =>
        Math.abs(a.dailyMinutes - capacityMinutes) -
        Math.abs(b.dailyMinutes - capacityMinutes),
    )[0]
    if (best) best.suggested = true
  }

  return list
}

/* ------------------------------------------------------------------ plan */

/**
 * Priority order for what to schedule first.
 *
 * Reopening the route comes before advancing it, so anything already missed
 * leads. After that: earliest due date, then the course's own sequence, which
 * is what encodes the dependencies between modules.
 */
function prioritise(journey: Journey): JourneyMilestone[] {
  const index = new Map(journey.milestones.map((m, i) => [m.id, i]))
  return journey.milestones.filter(isRemaining).sort((a, b) => {
    if ((a.status === 'missed') !== (b.status === 'missed')) {
      return a.status === 'missed' ? -1 : 1
    }
    const ad = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY
    const bd = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY
    if (ad !== bd) return ad - bd
    return (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0)
  })
}

const toItem = (m: JourneyMilestone): PlanItem => ({
  milestoneId: m.id,
  title: m.title,
  moduleName: m.subtitle ?? null,
  minutes: m.estimatedMinutes,
  checkpoint: m.checkpoint,
})

/**
 * Pack the remaining work into days of roughly `dailyMinutes`.
 *
 * Front-loaded on purpose. Finishing early leaves the slack before the
 * deadline rather than after it, which is the opposite of how the backlog got
 * here. An activity longer than a whole day's budget still gets scheduled -
 * it takes the day on its own instead of being declared impossible.
 */
export function buildPlan(
  journey: Journey,
  work: RemainingWork,
  dailyMinutes: number,
  strategy: StrategyId = 'balanced',
): RecoveryPlan {
  const budget = Math.max(10, dailyMinutes)
  const queue = prioritise(journey).map(toItem)

  const days: PlanDay[] = []
  let current: PlanItem[] = []
  let used = 0

  const closeDay = () => {
    if (current.length === 0) return
    const last = current[current.length - 1]
    days.push({
      index: days.length,
      dateISO: new Date(Date.now() + days.length * DAY).toISOString(),
      minutes: used,
      items: current,
      checkpoint: current.some((i) => i.checkpoint),
      checkpointLabel: last.checkpoint ? last.moduleName : null,
    })
    current = []
    used = 0
  }

  for (const item of queue) {
    if (current.length > 0 && used + item.minutes > budget) closeDay()
    current.push(item)
    used += item.minutes
    if (used >= budget) closeDay()
  }
  closeDay()

  // Anything past the deadline is reported, not hidden.
  const fits = work.daysLeft > 0 ? days.slice(0, work.daysLeft) : days
  const overflow = days.slice(fits.length).flatMap((d) => d.items)

  return {
    days: fits,
    dailyMinutes: budget,
    strategy,
    overflow,
    finishesInDays: days.length,
  }
}

/** The single next step, taken straight off the plan. */
export function todaysOneThing(plan: RecoveryPlan): PlanItem | null {
  return plan.days[0]?.items[0] ?? null
}

/** Total minutes a plan asks for. Used to sanity-check the copy. */
export const planMinutes = (plan: RecoveryPlan) =>
  plan.days.reduce((sum, d) => sum + d.minutes, 0)
