/**
 * "Show me a realistic way to get there."
 *
 * When the student asks about points, the mentor answers with numbers that
 * come from the same rules as the Rewards screen — never from the model,
 * which would guess. This walks the open steps in route order and adds what
 * each one is worth (an activity, plus a module when it is the module's last
 * open step) until the gap is covered. Locked steps count too: they unlock
 * as the route advances, and leaving them out would understate the course.
 *
 * Only guaranteed points count. Rhythm, comeback and review-card bonuses
 * would make the path shorter, but promising them would be a nudge dressed
 * up as a fact.
 */
import { pointsConfig } from './points'
import type { Journey, JourneyMilestone } from '@/types'

export interface RewardPath {
  steps: JourneyMilestone[]
  modules: number
  points: number
  minutes: number
  /** False when finishing everything left in this course still falls short. */
  reachable: boolean
}

export function pathToPoints(journey: Journey, gap: number): RewardPath {
  const openByModule = new Map<number, number>()
  for (const m of journey.milestones) {
    if (m.status !== 'completed') openByModule.set(m.moduleId, (openByModule.get(m.moduleId) ?? 0) + 1)
  }

  const path: RewardPath = { steps: [], modules: 0, points: 0, minutes: 0, reachable: gap <= 0 }
  if (gap <= 0) return path

  const todo = journey.milestones.filter((m) => m.status !== 'completed')
  const ordered = [...todo.filter((m) => m.status === 'missed'), ...todo.filter((m) => m.status !== 'missed')]
  for (const m of ordered) {
    path.steps.push(m)
    path.points += pointsConfig.POINTS_PER_ACTIVITY
    path.minutes += m.estimatedMinutes
    const left = (openByModule.get(m.moduleId) ?? 1) - 1
    openByModule.set(m.moduleId, left)
    if (left === 0) {
      path.modules += 1
      path.points += pointsConfig.POINTS_PER_MODULE
    }
    if (path.points >= gap) {
      path.reachable = true
      break
    }
  }
  return path
}
