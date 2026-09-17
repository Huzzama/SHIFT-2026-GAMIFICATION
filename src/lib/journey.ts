/**
 * Turns a Canvas snapshot into the visual route the student walks.
 *
 * A milestone is one Canvas assignment. The last item of each module is a
 * checkpoint - the "you made it this far" marker. Missed work is marked
 * `missed`, never styled as failure, and the recovery route reorders what
 * comes next instead of demanding everything at once.
 */
import type { CourseSnapshot } from '@/data/client'
import { dict } from '@/i18n'
import type {
  FrictionSignal,
  Journey,
  JourneyMilestone,
  Lang,
  NextBestAction,
  RecoveryStep,
} from '@/types'

export function buildJourney(
  snapshot: CourseSnapshot,
  friction: FrictionSignal,
): Journey {
  const now = Date.now()
  const ordered = [...snapshot.assignments].sort((a, b) => {
    const am = snapshot.modules.find((m) => m.id === a.module_id)?.position ?? 0
    const bm = snapshot.modules.find((m) => m.id === b.module_id)?.position ?? 0
    if (am !== bm) return am - bm
    return a.id - b.id
  })

  const lastOfModule = new Map<number, number>()
  ordered.forEach((a) => lastOfModule.set(a.module_id, a.id))

  let currentAssigned = false
  const milestones: JourneyMilestone[] = ordered.map((a) => {
    const mod = snapshot.modules.find((m) => m.id === a.module_id)
    const done = Boolean(a.submission)
    const overdue = !done && a.due_at !== null && new Date(a.due_at).getTime() < now
    const locked = !done && mod?.state === 'locked'

    let status: JourneyMilestone['status']
    if (done) status = 'completed'
    else if (overdue) status = 'missed'
    else if (locked) status = 'locked'
    else if (!currentAssigned) {
      status = 'current'
      currentAssigned = true
    } else status = 'upcoming'

    return {
      id: `a-${a.id}`,
      title: a.name,
      subtitle: mod?.name,
      status,
      checkpoint: lastOfModule.get(a.module_id) === a.id,
      estimatedMinutes: a.estimated_minutes,
      dueAt: a.due_at,
      moduleId: a.module_id,
      assignmentId: a.id,
    }
  })

  // With missed work present, the student stands at the first thing still open.
  const firstOpen = milestones.findIndex(
    (m) => m.status === 'missed' || m.status === 'current',
  )
  const completed = milestones.filter((m) => m.status === 'completed').length

  return {
    courseId: snapshot.course.id,
    courseName: snapshot.course.name,
    milestones,
    progressPercent: Math.round((completed / milestones.length) * 100),
    currentIndex: firstOpen === -1 ? milestones.length - 1 : firstOpen,
    recalculated: friction.state !== 'FLOWING',
  }
}

/**
 * One step, not a list. The point is to remove the decision, so the rule is
 * deliberately boring: the shortest open thing the student can actually finish
 * in the time they said they have.
 */
export function nextBestAction(
  journey: Journey,
  availableMinutes: number,
  lang: Lang = 'es',
): NextBestAction | null {
  const open = journey.milestones.filter(
    (m) => m.status === 'missed' || m.status === 'current' || m.status === 'upcoming',
  )
  if (open.length === 0) return null

  const fits = open.filter((m) => m.estimatedMinutes <= availableMinutes)
  const pick =
    fits.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0] ??
    open.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0]

  const t = dict(lang).journey.nbaReason
  const reason =
    pick.status === 'missed'
      ? t.missed
      : pick.estimatedMinutes <= availableMinutes
        ? t.fits
        : t.shortest

  return {
    milestoneId: pick.id,
    title: pick.title,
    reason,
    estimatedMinutes: pick.estimatedMinutes,
  }
}

const openStops = (journey: Journey) =>
  journey.milestones.filter(
    (m) => m.status === 'missed' || m.status === 'current' || m.status === 'upcoming',
  )

/**
 * The Comeback Mission: the smallest open thing on the route.
 *
 * Size is the whole point. This is not the most important step or the most
 * overdue one - it is the one least likely to be postponed again, because the
 * goal is breaking the inertia of returning, not catching up.
 */
export function comebackMilestone(journey: Journey): JourneyMilestone | null {
  const open = openStops(journey)
  if (open.length === 0) return null
  return [...open].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0]
}

/**
 * A recovery route: three small sessions, never "catch up on everything".
 * Today's step is always the smallest one - breaking inertia is the goal.
 */
export function recoveryRoute(journey: Journey, lang: Lang = 'es'): RecoveryStep[] {
  const open = openStops(journey).slice(0, 6)
  if (open.length === 0) return []

  const today = comebackMilestone(journey)
  if (!today) return []
  const rest = open.filter((m) => m.id !== today.id)

  const steps: RecoveryStep[] = [
    {
      when: 'today',
      title: `${dict(lang).journey.reconnect} ${today.title}`,
      estimatedMinutes: Math.min(10, today.estimatedMinutes),
      kind: 'comeback_mission',
    },
  ]
  if (rest[0])
    steps.push({
      when: 'tomorrow',
      title: rest[0].title,
      estimatedMinutes: rest[0].estimatedMinutes,
      kind: 'review',
    })
  if (rest[1])
    steps.push({
      when: 'next_session',
      title: rest[1].title,
      estimatedMinutes: rest[1].estimatedMinutes,
      kind: 'continue',
    })
  return steps
}
