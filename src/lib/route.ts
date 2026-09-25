/**
 * The course as a route of modules — what Home's trail and Journey's map draw.
 *
 * `journey.ts` works in activities; the route works in modules, because that
 * is the scale at which a student thinks "where am I": module 3 of 6.
 *
 *  - The student stands at the first module that is not finished. That is
 *    where the ship is drawn.
 *  - A module with overdue work carries `friction` (a storm on the map). It is
 *    a note about the water, never a verdict about the student.
 *  - When FARO has recalculated the route (`journey.recalculated`), a safe
 *    harbour waypoint is inserted just before the student's position: the
 *    place from which the new route leaves. The destination never moves.
 *
 * Pure and data-driven: the same function works on fixtures and on a live
 * Canvas course, and nothing here is a visual constant.
 */
import type { Journey } from '@/types'

export type RouteModuleState = 'completed' | 'current' | 'upcoming' | 'locked'

export interface RouteModule {
  moduleId: number
  /** 1-based position in the course. */
  number: number
  name: string
  state: RouteModuleState
  /** Overdue work still open in this module. */
  friction: boolean
  done: number
  total: number
}

export interface CourseRoute {
  modules: RouteModule[]
  /** Index into `modules` of where the student stands; `modules.length` when finished. */
  position: number
  /** Whether FARO recalculated the route (a safe harbour appears before `position`). */
  recalculated: boolean
  finished: boolean
}

export function courseRoute(journey: Journey, moduleNames: Map<number, string>): CourseRoute {
  const ids: number[] = []
  for (const m of journey.milestones) if (!ids.includes(m.moduleId)) ids.push(m.moduleId)

  const raw = ids.map((id, i) => {
    const stops = journey.milestones.filter((m) => m.moduleId === id)
    const done = stops.filter((s) => s.status === 'completed').length
    return {
      moduleId: id,
      number: i + 1,
      name: moduleNames.get(id) ?? stops[0]?.subtitle ?? `${i + 1}`,
      done,
      total: stops.length,
      friction: stops.some((s) => s.status === 'missed'),
      allLocked: stops.every((s) => s.status === 'locked'),
    }
  })

  const position = raw.findIndex((m) => m.done < m.total)
  const finished = position === -1

  const modules: RouteModule[] = raw.map((m, i) => ({
    moduleId: m.moduleId,
    number: m.number,
    name: m.name,
    friction: m.friction,
    done: m.done,
    total: m.total,
    state:
      m.done === m.total
        ? 'completed'
        : i === position
          ? 'current'
          : m.allLocked
            ? 'locked'
            : 'upcoming',
  }))

  return {
    modules,
    position: finished ? modules.length : position,
    recalculated: journey.recalculated && !finished,
    finished,
  }
}
